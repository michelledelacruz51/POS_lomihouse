const authScreen = document.getElementById("authScreen");
const authMessage = document.getElementById("authMessage");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const signInForm = document.getElementById("signInForm");
const signUpForm = document.getElementById("signUpForm");
let supabaseClient;
let activeUserId = "";
let activationInProgress = null;
let activationGeneration = 0;

function setAuthMessage(message, type = "") {
    authMessage.textContent = message;
    authMessage.className = `auth-message${type ? ` ${type}` : ""}`;
}

function showAuthForm(formName) {
    const isSignIn = formName === "signIn";

    signInForm.classList.toggle("hidden", !isSignIn);
    signUpForm.classList.toggle("hidden", isSignIn);
    document.getElementById("signInTab").classList.toggle("active", isSignIn);
    document.getElementById("signUpTab").classList.toggle("active", !isSignIn);
    document.getElementById("signInTab").setAttribute("aria-selected", String(isSignIn));
    document.getElementById("signUpTab").setAttribute("aria-selected", String(!isSignIn));
    authTitle.textContent = isSignIn ? "Welcome back" : "Create your account";
    authSubtitle.textContent = isSignIn
        ? "Sign in to continue to your restaurant POS."
        : "Sign up to get started with your restaurant POS.";
    setAuthMessage("");
}

function setAuthenticatedUser(user) {
    const name = user.user_metadata?.full_name || user.email || "POS User";
    const initials = name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();

    writeStoredData("foodHubActiveAccount", {
        name,
        role: "Staff",
        initials
    });
    updateVisibleAccount();
    document.body.classList.add("is-authenticated");
    authScreen.setAttribute("aria-hidden", "true");
}

function showSignIn(message = "", type = "") {
    document.body.classList.remove("is-authenticated");
    authScreen.setAttribute("aria-hidden", "false");
    showAuthForm("signIn");
    setAuthMessage(message, type);
}

async function activateSession(session) {
    if (!session?.user || !session.access_token) {
        return;
    }

    const userId = session.user.id;
    if (activeUserId === userId) {
        window.posBackend.setAccessToken(session.access_token);
        return;
    }

    if (activationInProgress?.userId === userId) {
        activationInProgress.session = session;
        window.posBackend.setAccessToken(session.access_token);
        return activationInProgress.promise;
    }

    const generation = ++activationGeneration;
    const activationState = { userId, session, promise: null };
    window.posBackend.clear();
    activationState.promise = (async () => {
        setAuthMessage("Loading your restaurant data...");

        try {
            const loaded = await window.posBackend.load(
                userId,
                session.access_token,
                () => generation === activationGeneration
            );
            if (!loaded || generation !== activationGeneration) {
                return;
            }
        } catch (error) {
            if (generation !== activationGeneration) {
                return;
            }
            showSignIn(`Unable to load restaurant data: ${error.message}`, "error");
            return;
        }

        if (generation !== activationGeneration) {
            return;
        }

        const currentSession = activationState.session;
        activeUserId = userId;
        window.posBackend.setAccessToken(currentSession.access_token);
        window.refreshPOSFromBackend();
        setAuthenticatedUser(currentSession.user);
    })();
    activationInProgress = activationState;
    await activationState.promise;

    if (activationInProgress === activationState) {
        activationInProgress = null;
    }
}

function requireSupabaseClient() {
    if (supabaseClient) {
        return true;
    }

    const config = window.SUPABASE_CONFIG;
    const message = !window.supabase?.createClient
        ? "The Supabase Auth library could not load. Check your internet connection and reload the page."
        : !config?.url || !config?.anonKey
            ? "Authentication is not configured. Add your Supabase project URL and public anon key to supabase-config.js."
            : "Supabase Auth could not be initialized. Check the project URL and public anon key.";
    setAuthMessage(message, "error");
    return false;
}

signInForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!requireSupabaseClient()) {
        return;
    }

    const submitButton = signInForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    setAuthMessage("Signing in...");

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: signInForm.elements.email.value.trim(),
        password: signInForm.elements.password.value
    });

    submitButton.disabled = false;

    if (error) {
        if (error.code === "email_not_confirmed" || error.message.toLowerCase().includes("email not confirmed")) {
            setAuthMessage("Email confirmation is still enabled in Supabase. Disable Confirm email in your Supabase Authentication settings to sign in without email verification.", "error");
        } else if (error.code === "invalid_credentials" || error.message.toLowerCase().includes("invalid login credentials")) {
            setAuthMessage("Email or password is incorrect. If you created this account before disabling email confirmation, confirm it under Supabase Authentication > Users before signing in.", "error");
        } else {
            setAuthMessage(error.message, "error");
        }
        return;
    }

    await activateSession(data.session);
});

signUpForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!requireSupabaseClient()) {
        return;
    }

    const name = signUpForm.elements.name.value.trim();
    const password = signUpForm.elements.password.value;
    const passwordConfirm = signUpForm.elements.passwordConfirm.value;

    if (password !== passwordConfirm) {
        setAuthMessage("The passwords do not match.", "error");
        signUpForm.elements.passwordConfirm.focus();
        return;
    }

    const submitButton = signUpForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    setAuthMessage("Creating your account...");

    const { data, error } = await supabaseClient.auth.signUp({
        email: signUpForm.elements.email.value.trim(),
        password,
        options: {
            data: {
                full_name: name
            }
        }
    });

    submitButton.disabled = false;

    if (error) {
        setAuthMessage(error.message, "error");
        return;
    }

    if (data.session && data.user) {
        await activateSession(data.session);
        return;
    }

    signInForm.elements.email.value = signUpForm.elements.email.value.trim();
    signUpForm.reset();
    showAuthForm("signIn");

    if (data.user?.identities?.length === 0) {
        setAuthMessage("An account with this email already exists. Sign in with that account. If it was created before email confirmation was disabled, confirm it under Supabase Authentication > Users.", "error");
        return;
    }

    setAuthMessage("Supabase did not start a session for this account. Check that Confirm email is disabled in your Supabase Authentication settings.", "error");
});

async function signOut() {
    if (!requireSupabaseClient()) {
        return;
    }

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        document.querySelector(".account-switcher-help").textContent = `Unable to sign out: ${error.message}`;
        return;
    }

    closeAccountSwitcher();
    activeUserId = "";
    activationGeneration += 1;
    activationInProgress = null;
    window.posBackend.clear();
    showSignIn("You have been signed out.", "success");
}

function initializeSupabaseAuth() {
    const config = window.SUPABASE_CONFIG;

    if (!window.supabase?.createClient || !config?.url || !config?.anonKey) {
        showSignIn("Add your Supabase project URL and public anon key to supabase-config.js to enable sign in.");
        return;
    }

    try {
        supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
            auth: {
                persistSession: false
            }
        });
    } catch (error) {
        setAuthMessage(`Supabase Auth could not be initialized: ${error.message}`, "error");
        return;
    }

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            void activateSession(session);
        } else {
            activeUserId = "";
            activationGeneration += 1;
            activationInProgress = null;
            window.posBackend.clear();
            showSignIn();
        }
    });
}

initializeSupabaseAuth();
