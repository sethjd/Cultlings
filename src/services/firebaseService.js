(function () {
  const C = window.Cultlings = window.Cultlings || {};
  const SDK_VERSION = "12.7.0";
  const SDK_ROOT = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;

  function hasUsableConfig(config) {
    return Boolean(
      config &&
      config.apiKey &&
      config.projectId &&
      config.appId &&
      !String(config.apiKey).includes("YOUR_") &&
      !String(config.projectId).includes("YOUR_")
    );
  }

  class FirebaseService {
    constructor() {
      this.configured = hasUsableConfig(window.CULTLINGS_FIREBASE_CONFIG);
      this.status = this.configured ? "connecting" : "offline";
      this.error = null;
      this.app = null;
      this.auth = null;
      this.db = null;
      this.user = null;
      this.api = null;
      this.readyPromise = null;
      this.listeners = new Set();
    }

    subscribe(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }

    notify() {
      const snapshot = this.getStatus();
      this.listeners.forEach((listener) => listener(snapshot));
    }

    getStatus() {
      return {
        configured: this.configured,
        status: this.status,
        connected: this.status === "online",
        uid: this.user ? this.user.uid : null,
        error: this.error
      };
    }

    async init() {
      if (this.readyPromise) return this.readyPromise;
      if (!this.configured) {
        this.status = "offline";
        this.notify();
        return this.getStatus();
      }

      this.readyPromise = this.connect();
      return this.readyPromise;
    }

    async connect() {
      try {
        const [appApi, authApi, firestoreApi] = await Promise.all([
          import(`${SDK_ROOT}/firebase-app.js`),
          import(`${SDK_ROOT}/firebase-auth.js`),
          import(`${SDK_ROOT}/firebase-firestore.js`)
        ]);

        this.api = { ...appApi, ...authApi, ...firestoreApi };
        this.app = appApi.initializeApp(window.CULTLINGS_FIREBASE_CONFIG);
        this.auth = authApi.getAuth(this.app);
        this.db = firestoreApi.getFirestore(this.app);

        const credential = this.auth.currentUser
          ? { user: this.auth.currentUser }
          : await authApi.signInAnonymously(this.auth);
        this.user = credential.user;
        this.status = "online";
        this.error = null;
      } catch (error) {
        console.warn("Firebase unavailable; continuing in Offline Mode.", error);
        this.status = "unavailable";
        this.error = error && error.message ? error.message : "Firebase connection failed";
      }
      this.notify();
      return this.getStatus();
    }

    isOnline() {
      return this.status === "online" && Boolean(this.user && this.db && this.api);
    }

    requireOnline() {
      if (!this.isOnline()) throw new Error("Firebase is not connected.");
    }

    document(collectionName, documentId) {
      this.requireOnline();
      return this.api.doc(this.db, collectionName, documentId);
    }

    collection(collectionName) {
      this.requireOnline();
      return this.api.collection(this.db, collectionName);
    }
  }

  C.FirebaseService = new FirebaseService();
})();
