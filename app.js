// ==========================================================================
// Master Net Accounting - Application Engine (app.js)
// ==========================================================================

// 1. تعريف الفئات والتصنيفات للأرباح والاشتراكات
const categories = {
    revenue: [
        { id: 'home_subs', label: '📶 اشتراكات منزلية وشهرية', icon: '🏠' },
        { id: 'card_sales', label: '📥 مبيعات كروت مباشر', icon: '🎫' },
        { id: 'super_packages', label: '💎 باقات فائقة', icon: '🚀' },
        { id: 'other_revenue', label: '➕ إيرادات أخرى', icon: '💵' }
    ],
    expense: [
        { id: 'internet_line', label: '🌐 خط الإنترنت الرئيسي', icon: '⚡' },
        { id: 'maintenance', label: '🛠️ صيانة وأجهزة', icon: '⚙️' },
        { id: 'power', label: '☀️ كهرباء وطاقة شمسية', icon: '🔋' },
        { id: 'rent', label: '🏢 إيجار مواقع الأبراج', icon: '🗼' },
        { id: 'salaries', label: '👥 رواتب موظفين', icon: '💼' },
        { id: 'other_expense', label: '➖ مصاريف أخرى', icon: '💳' }
    ]
};

// 2. المشتركون الافتراضيون للشبكة
const defaultSellers = [
    { id: 'sub_1', name: 'فيلا أبو أحمد المنزلي', phone: '0599332956', location: 'شارع السلام - الطابق الثاني', balance: 50, history: [{ id: 'h_1', type: 'delivered', amount: 50, date: new Date().toISOString(), description: 'تجديد باقة شهرية 30 ميجا' }] },
    { id: 'sub_2', name: 'اشتراك عمارة السلام (أبو علي)', phone: '0599332956', location: 'عمارة السلام - شقة 4', balance: 70, history: [{ id: 'h_2', type: 'delivered', amount: 70, date: new Date().toISOString(), description: 'تجديد باقة شهرية 50 ميجا' }] },
    { id: 'sub_3', name: 'شقة عماد دردونة', phone: '0599332956', location: 'حي الأمل - الطابق الأرضي', balance: 0, history: [] },
    { id: 'sub_4', name: 'محل المختار للاتصالات', phone: '0599332956', location: 'الشارع الرئيسي - مقابل شمس', balance: 100, history: [{ id: 'h_3', type: 'delivered', amount: 100, date: new Date().toISOString(), description: 'تجديد باقة شهرية 100 ميجا' }] },
    { id: 'sub_5', name: 'صالون الوردة للتجميل', phone: '0599332956', location: 'مفترق السلام', balance: 0, history: [] },
    { id: 'sub_6', name: 'اشتراك سوبرماركت الرواغ', phone: '0599332956', location: 'بجوار المسجد الكبير', balance: 50, history: [{ id: 'h_4', type: 'delivered', amount: 50, date: new Date().toISOString(), description: 'تجديد باقة شهرية 30 ميجا' }] },
    { id: 'sub_7', name: 'منزل الحاجة أم محمد', phone: '0599332956', location: 'حي التقوى', balance: 30, history: [{ id: 'h_5', type: 'delivered', amount: 30, date: new Date().toISOString(), description: 'تجديد باقة شهرية 15 ميجا' }] },
    { id: 'sub_8', name: 'مركز سما للألعاب', phone: '0599332956', location: 'مفترق البلدية', balance: 100, history: [{ id: 'h_6', type: 'delivered', amount: 100, date: new Date().toISOString(), description: 'تجديد باقة شهرية 100 ميجا' }] }
];

// الحسابات الافتراضية للوصول بالصلاحيات
const defaultUsers = [
    { username: 'admin', password: '12imad', role: 'admin', roleLabel: 'مدير عام 👑' },
    { username: 'accountant', password: '12345', role: 'accountant', roleLabel: 'محاسب 💼' },
    { username: 'viewer', password: '1122', role: 'viewer', roleLabel: 'مراقب 👁️' }
];

// باقات الإنترنت الافتراضية للشبكة
const defaultPackages = [
    { id: 'pkg_15', name: 'سرعة 15 ميجا', price: 30 },
    { id: 'pkg_30', name: 'سرعة 30 ميجا', price: 50 },
    { id: 'pkg_50', name: 'سرعة 50 ميجا', price: 70 },
    { id: 'pkg_100', name: 'سرعة 100 ميجا', price: 100 }
];

// 3. حالة التطبيق (State)
let state = {
    transactions: [],
    sellers: [], // المشتركون
    users: [], // الموظفون
    packages: [], // باقات التجديد
    currentUser: null,
    historyFilter: 'all'
};

// 4. متغيرات المخططات البيانية (Charts)
let dashboardChart = null;
let revenueChartInstance = null;
let expenseChartInstance = null;

// المشترك النشط المفتوح كشف حسابه حالياً
let activeSellerId = null;

// متغيرات ومفاتيح الربط السحابي لـ Firebase
let isFirebaseActive = false;
let db = null;
let auth = null;
let firestoreListeners = [];

// ==========================================================================
// 5. تهيئة التطبيق عند البدء
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initAppClock();
    
    // فحص تهيئة السحاب قبل الجلسة
    checkFirebaseConfig();
    
    // التحقق من جلسة تسجيل الدخول
    checkSession();
    
    // تهيئة الفئات للنموذج
    toggleFormCategories();
    
    // تهيئة PWA
    initPWAService();
});

// تحديث الساعة في الهيدر
function initAppClock() {
    function updateHeaderClock() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let ampm = hours >= 12 ? 'مساءً' : 'صباحاً';
        
        let displayHours = hours % 12 || 12;
        let displayMinutes = minutes < 10 ? '0' + minutes : minutes;
        
        const clockEl = document.getElementById('clock');
        const ampmEl = document.getElementById('ampm');
        if (clockEl) clockEl.innerText = displayHours + ':' + displayMinutes;
        if (ampmEl) ampmEl.innerText = ampm;
        
        setTimeout(updateHeaderClock, 10000);
    }
    updateHeaderClock();
}

// تحميل البيانات من LocalStorage
function loadData() {
    try {
        const storedTransactions = localStorage.getItem('mn_transactions');
        const storedSellers = localStorage.getItem('mn_sellers');
        const storedUsers = localStorage.getItem('mn_users');
        const storedPackages = localStorage.getItem('mn_packages');
        
        if (storedTransactions) {
            state.transactions = JSON.parse(storedTransactions);
        } else {
            state.transactions = [];
        }
        
        if (storedSellers) {
            state.sellers = JSON.parse(storedSellers);
        } else {
            state.sellers = [...defaultSellers];
            localStorage.setItem('mn_sellers', JSON.stringify(state.sellers));
        }

        if (storedUsers) {
            state.users = JSON.parse(storedUsers);
        } else {
            state.users = [...defaultUsers];
            localStorage.setItem('mn_users', JSON.stringify(state.users));
        }

        if (storedPackages) {
            state.packages = JSON.parse(storedPackages);
        } else {
            state.packages = [...defaultPackages];
            localStorage.setItem('mn_packages', JSON.stringify(state.packages));
        }
    } catch (e) {
        console.error('Error loading database:', e);
        state.transactions = [];
        state.sellers = [...defaultSellers];
        state.users = [...defaultUsers];
        state.packages = [...defaultPackages];
    }
}

// حفظ البيانات في LocalStorage
function saveData() {
    try {
        localStorage.setItem('mn_transactions', JSON.stringify(state.transactions));
        localStorage.setItem('mn_sellers', JSON.stringify(state.sellers));
        localStorage.setItem('mn_users', JSON.stringify(state.users));
        localStorage.setItem('mn_packages', JSON.stringify(state.packages));
    } catch (e) {
        console.error('Error saving database:', e);
    }
}

// ==========================================================================
// 🔐 محرك نظام تسجيل الدخول والصلاحيات
// ==========================================================================

// دالة فحص وتفعيل اتصال Firebase بناء على الإعدادات المخزنة
function checkFirebaseConfig() {
    let configStr = localStorage.getItem('mn_firebase_config');
    if (!configStr) {
        // تلقائياً نقوم بتهيئة المفاتيح الخاصة بمشروعك التي أنشأتها للتو
        const defaultCloudConfig = {
            apiKey: "AIzaSyDgBg4Ba5Ckyc5_DateF8as8xvcrAqmDM4",
            authDomain: "master-net-62447.firebaseapp.com",
            projectId: "master-net-62447",
            storageBucket: "master-net-62447.firebasestorage.app",
            messagingSenderId: "624958433480",
            appId: "1:624958433480:web:f42fa8844383a689da5dfd"
        };
        localStorage.setItem('mn_firebase_config', JSON.stringify(defaultCloudConfig));
        configStr = JSON.stringify(defaultCloudConfig);
    }
    
    if (configStr) {
        try {
            const config = JSON.parse(configStr);
            if (config.apiKey && config.projectId) {
                firebase.initializeApp(config);
                auth = firebase.auth();
                db = firebase.firestore();
                isFirebaseActive = true;
                
                // تفعيل وضع الأوفلاين في فايرستور لحفظ البيانات محلياً عند انقطاع الشبكة
                db.enablePersistence().catch((err) => {
                    console.warn("Firestore persistence error:", err.code);
                });
                
                const cloudBadge = document.getElementById('cloud-status-badge');
                if (cloudBadge) {
                    cloudBadge.innerText = 'سحابي ☁️';
                    cloudBadge.className = 'cloud-status-badge cloud-connected';
                }
            }
        } catch (e) {
            console.error("Firebase init failed:", e);
        }
    }
}

function checkSession() {
    if (isFirebaseActive) {
        // إدارة الجلسة سحابياً عبر Firebase Auth
        auth.onAuthStateChanged((user) => {
            if (user) {
                loadUserProfileAndStartSync(user);
            } else {
                document.getElementById('login-overlay-screen').style.display = 'flex';
            }
        });
    } else {
        // إدارة الجلسة محلياً عبر LocalStorage
        const savedSession = localStorage.getItem('mn_active_session');
        if (savedSession) {
            const user = state.users.find(u => u.username === savedSession);
            if (user) {
                loginUserSuccess(user);
                return;
            }
        }
        document.getElementById('login-overlay-screen').style.display = 'flex';
    }
}

function handleUserLogin(e) {
    e.preventDefault();
    
    const usernameInput = document.getElementById('login-username').value.trim().toLowerCase();
    const passwordInput = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('login-remember-me').checked;
    
    const user = state.users.find(u => u.username === usernameInput && u.password === passwordInput);
    
    if (user) {
        document.getElementById('login-error-message').style.display = 'none';
        
        if (isFirebaseActive) {
            // تسجيل الدخول المجهول كجسر أمان للوصول لقاعدة البيانات السحابية للحسابات المحلية
            auth.signInAnonymously().then(() => {
                localStorage.setItem('mn_local_username_override', user.username);
                if (rememberMe) {
                    localStorage.setItem('mn_active_session', user.username);
                } else {
                    sessionStorage.setItem('mn_active_session', user.username);
                }
                loginUserSuccess(user);
            }).catch(err => {
                console.error("Anonymous signin failed:", err);
                alert("تحذير: فشل تأمين الاتصال السحابي المؤقت للحساب!\n\nالسبب المحتمل: خاصية 'تسجيل الدخول المجهول' (Anonymous Auth) غير مفعلة في لوحة تحكم Firebase لمشروعك.\n\nسيتم تسجيل دخولك بالوضع المحلي الآن (دون مزامنة سحابية مؤقتاً).");
                
                // الدخول بالوضع المحلي وتعطيل المزامنة مؤقتاً للجلسة الحالية
                isFirebaseActive = false;
                localStorage.removeItem('mn_local_username_override');
                
                // تحديث شارة الحالة السحابية
                const cloudBadge = document.getElementById('cloud-status-badge');
                if (cloudBadge) {
                    cloudBadge.innerText = 'محلي (مؤقت) 📍';
                    cloudBadge.className = 'cloud-status-badge cloud-offline';
                }
                
                if (rememberMe) {
                    localStorage.setItem('mn_active_session', user.username);
                } else {
                    sessionStorage.setItem('mn_active_session', user.username);
                }
                loginUserSuccess(user);
            });
        } else {
            if (rememberMe) {
                localStorage.setItem('mn_active_session', user.username);
            } else {
                sessionStorage.setItem('mn_active_session', user.username);
            }
            loginUserSuccess(user);
        }
    } else {
        const errorBox = document.getElementById('login-error-message');
        errorBox.style.display = 'block';
        errorBox.style.animation = 'none';
        errorBox.offsetHeight; 
        errorBox.style.animation = 'shake 0.3s ease';
    }
}

// دالة تسجيل الدخول عبر جوجل
function loginWithGoogle() {
    if (!isFirebaseActive) {
        alert("الرجاء تهيئة إعدادات Firebase السحابية أولاً من خلال الضغط على زر إعدادات الربط السحابي بالأسفل.");
        openFirebaseSetupModal();
        return;
    }
    
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        console.error("Google Sign-In Error:", error);
        alert("فشل تسجيل الدخول باستخدام Google: " + error.message);
    });
}

// دالة جلب بروفايل حساب Google ومزامنة الصلاحيات والتحميل
function loadUserProfileAndStartSync(user) {
    if (user.isAnonymous) {
        // مستخدم محلي مسجل دخول بالاسم وكلمة المرور
        const localUsername = localStorage.getItem('mn_local_username_override') || 'viewer';
        const localUser = state.users.find(u => u.username === localUsername) || { username: 'viewer', role: 'viewer', roleLabel: 'مراقب 👁️' };
        loginUserSuccess(localUser);
        startRealtimeSync();
        return;
    }
    
    // مستخدم قوقل حقيقي
    const email = user.email;
    const uid = user.uid;
    const displayName = user.displayName || user.email.split('@')[0];
    
    db.collection('users').doc(uid).get().then((doc) => {
        let userProfile;
        if (doc.exists) {
            userProfile = doc.data();
            if (userProfile.displayName !== displayName) {
                userProfile.displayName = displayName;
                db.collection('users').doc(uid).update({ displayName });
            }
        } else {
            // التحقق مما إذا كان هناك أي مستخدم Google مسجل مسبقاً كمدير عام
            db.collection('users').get().then((snapshot) => {
                let role = 'viewer';
                let roleLabel = 'مراقب 👁️';
                
                const hasGoogleAdmin = snapshot.docs.some(doc => {
                    const data = doc.data();
                    return data.uid && data.role === 'admin';
                });
                
                if (!hasGoogleAdmin) {
                    role = 'admin';
                    roleLabel = 'مدير عام 👑';
                }
                
                userProfile = {
                    uid: uid,
                    username: email,
                    displayName: displayName,
                    role: role,
                    roleLabel: roleLabel
                };
                
                db.collection('users').doc(uid).set(userProfile);
            }).catch(err => {
                console.error("Error checking users for Google Admin:", err);
                // في حال حدوث خطأ، نعينه كمدير احتياطاً للمستخدم الأول
                userProfile = {
                    uid: uid,
                    username: email,
                    displayName: displayName,
                    role: 'admin',
                    roleLabel: 'مدير عام 👑'
                };
                db.collection('users').doc(uid).set(userProfile);
            });
        }
        
        const interval = setInterval(() => {
            if (userProfile) {
                clearInterval(interval);
                loginUserSuccess(userProfile);
                startRealtimeSync();
            }
        }, 100);
        
    }).catch(err => {
        console.warn("Could not fetch user profile from DB:", err);
        // Fallback profile
        const fallbackUser = {
            uid: uid,
            username: email,
            displayName: displayName,
            role: 'viewer',
            roleLabel: 'مراقب 👁️'
        };
        loginUserSuccess(fallbackUser);
        startRealtimeSync();
    });
}

// دالة المزامنة السحابية اللحظية مع Firestore
function startRealtimeSync() {
    if (!isFirebaseActive || !db) return;
    
    firestoreListeners.forEach(unsub => unsub());
    firestoreListeners = [];
    
    const cloudBadge = document.getElementById('cloud-status-badge');
    
    // مستمع لحالة اتصال الإنترنت
    window.addEventListener('online', () => {
        if (cloudBadge) {
            cloudBadge.innerText = 'سحابي ☁️';
            cloudBadge.className = 'cloud-status-badge cloud-connected';
        }
    });
    window.addEventListener('offline', () => {
        if (cloudBadge) {
            cloudBadge.innerText = 'أوفلاين 🚫';
            cloudBadge.className = 'cloud-status-badge cloud-offline';
        }
    });
    
    // 1. مراقبة باقات الإنترنت
    const unsubPackages = db.collection('packages').onSnapshot((snapshot) => {
        const pkgs = [];
        snapshot.forEach(doc => pkgs.push(doc.data()));
        if (pkgs.length > 0) {
            state.packages = pkgs;
            localStorage.setItem('mn_packages', JSON.stringify(state.packages));
            renderAdminPackagesTable();
        }
    }, err => console.warn("Packages sync error:", err));
    firestoreListeners.push(unsubPackages);
    
    // 2. مراقبة الموظفين والمستخدمين
    const unsubUsers = db.collection('users').onSnapshot((snapshot) => {
        const users = [];
        snapshot.forEach(doc => users.push(doc.data()));
        if (users.length > 0) {
            state.users = [...defaultUsers];
            users.forEach(u => {
                const idx = state.users.findIndex(du => du.username === u.username || du.uid === u.uid);
                if (idx !== -1) {
                    state.users[idx] = u;
                } else {
                    state.users.push(u);
                }
            });
            localStorage.setItem('mn_users', JSON.stringify(state.users));
            renderAdminUsersTable();
            
            // تحديث الصلاحيات فوراً في حال تم تغيير دور المستخدم الحالي
            if (state.currentUser) {
                const updatedMe = state.users.find(u => u.username === state.currentUser.username || u.uid === state.currentUser.uid);
                if (updatedMe && updatedMe.role !== state.currentUser.role) {
                    state.currentUser = updatedMe;
                    applyUserPermissions(state.currentUser);
                    alert("⚠️ تم تحديث صلاحيات حسابك من قبل الإدارة!");
                }
            }
        }
    }, err => console.warn("Users sync error:", err));
    firestoreListeners.push(unsubUsers);
    
    // 3. مراقبة المشتركين
    const unsubSellers = db.collection('sellers').onSnapshot((snapshot) => {
        const sellers = [];
        snapshot.forEach(doc => sellers.push(doc.data()));
        if (sellers.length > 0) {
            state.sellers = sellers;
            localStorage.setItem('mn_sellers', JSON.stringify(state.sellers));
            
            const activeScreen = document.querySelector('.app-screen.active');
            if (activeScreen && activeScreen.id === 'screen-sellers') {
                renderSellers();
            }
            if (activeScreen && activeScreen.id === 'screen-dashboard') {
                renderDashboard();
            }
            
            if (activeSellerId) {
                const seller = state.sellers.find(s => s.id === activeSellerId);
                if (seller) updateLedgerUI(seller);
            }
        }
    }, err => console.warn("Sellers sync error:", err));
    firestoreListeners.push(unsubSellers);
    
    // 4. مراقبة الحركات المالية
    const unsubTransactions = db.collection('transactions').onSnapshot((snapshot) => {
        const transactions = [];
        snapshot.forEach(doc => transactions.push(doc.data()));
        state.transactions = transactions;
        localStorage.setItem('mn_transactions', JSON.stringify(state.transactions));
        
        const activeScreen = document.querySelector('.app-screen.active');
        if (activeScreen && activeScreen.id === 'screen-dashboard') {
            renderDashboard();
        }
        if (activeScreen && activeScreen.id === 'screen-history') {
            renderHistory();
        }
        if (activeScreen && activeScreen.id === 'screen-reports') {
            renderReports();
        }
    }, err => console.warn("Transactions sync error:", err));
    firestoreListeners.push(unsubTransactions);
}

function loginUserSuccess(user) {
    state.currentUser = user;
    
    const loginScreen = document.getElementById('login-overlay-screen');
    loginScreen.style.opacity = '0';
    setTimeout(() => {
        loginScreen.style.display = 'none';
        loginScreen.style.opacity = '1';
    }, 400);
    
    const userBadge = document.getElementById('current-user-badge');
    if (userBadge) {
        userBadge.innerText = user.displayName || user.roleLabel || user.role;
        userBadge.className = `user-role-badge ${user.role || 'viewer'}`;
    }
    
    applyUserPermissions(user);
    
    switchScreen('dashboard', document.querySelector('.nav-item'));
}

function logoutUser() {
    if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
        localStorage.removeItem('mn_active_session');
        sessionStorage.removeItem('mn_active_session');
        localStorage.removeItem('mn_local_username_override');
        state.currentUser = null;
        
        if (isFirebaseActive) {
            auth.signOut().then(() => {
                window.location.reload();
            });
        } else {
            document.getElementById('login-password').value = '';
            document.getElementById('login-overlay-screen').style.display = 'flex';
        }
    }
}

function applyUserPermissions(user) {
    const role = user.role;
    
    const headerAddBtn = document.getElementById('header-add-btn-shortcut');
    const footerAddBtn = document.getElementById('footer-add-btn-action');
    const addSellerBtn = document.getElementById('add-seller-btn-action');
    const ledgerActions = document.getElementById('ledger-actions-container');
    
    const userMgmtBtn = document.getElementById('admin-user-mgmt-btn');
    const packagesMgmtBtn = document.getElementById('admin-packages-mgmt-btn');
    const dataMgmtGroup = document.getElementById('settings-data-management-group');
    const uploadDashboardBtn = document.getElementById('dashboard-upload-btn-action');
    
    if (role === 'viewer') {
        if (headerAddBtn) headerAddBtn.style.display = 'none';
        if (footerAddBtn) footerAddBtn.style.display = 'none';
        if (addSellerBtn) addSellerBtn.style.display = 'none';
        if (ledgerActions) ledgerActions.style.display = 'none';
        if (userMgmtBtn) userMgmtBtn.style.display = 'none';
        if (packagesMgmtBtn) packagesMgmtBtn.style.display = 'none';
        if (dataMgmtGroup) dataMgmtGroup.style.display = 'none';
        if (uploadDashboardBtn) uploadDashboardBtn.style.display = 'none'; // حظر الرفع
    } else if (role === 'accountant') {
        if (headerAddBtn) headerAddBtn.style.display = 'flex';
        if (footerAddBtn) footerAddBtn.style.display = 'flex';
        if (addSellerBtn) addSellerBtn.style.display = 'block';
        if (ledgerActions) ledgerActions.style.display = 'grid';
        if (userMgmtBtn) userMgmtBtn.style.display = 'none';
        if (packagesMgmtBtn) packagesMgmtBtn.style.display = 'none';
        if (dataMgmtGroup) dataMgmtGroup.style.display = 'none';
        if (uploadDashboardBtn) uploadDashboardBtn.style.display = 'block'; // متاح الرفع للمزامنة
    } else if (role === 'admin') {
        if (headerAddBtn) headerAddBtn.style.display = 'flex';
        if (footerAddBtn) footerAddBtn.style.display = 'flex';
        if (addSellerBtn) addSellerBtn.style.display = 'block';
        if (ledgerActions) ledgerActions.style.display = 'grid';
        if (userMgmtBtn) userMgmtBtn.style.display = 'flex';
        if (packagesMgmtBtn) packagesMgmtBtn.style.display = 'flex';
        if (dataMgmtGroup) dataMgmtGroup.style.display = 'block';
        if (uploadDashboardBtn) uploadDashboardBtn.style.display = 'block';
    }
}

// تغيير كلمة المرور للمستخدم الحالي
function openChangePasswordModal() {
    document.getElementById('change-password-modal').style.display = 'flex';
}

function closeChangePasswordModal() {
    document.getElementById('change-password-modal').style.display = 'none';
    document.getElementById('change-password-form').reset();
}

function processChangePassword(e) {
    e.preventDefault();
    
    const oldPass = document.getElementById('old-pass').value;
    const newPass = document.getElementById('new-pass').value;
    
    if (state.currentUser.password !== oldPass) {
        alert('كلمة المرور الحالية غير صحيحة!');
        return;
    }
    
    const userIndex = state.users.findIndex(u => u.username === state.currentUser.username);
    if (userIndex !== -1) {
        state.users[userIndex].password = newPass;
        state.currentUser.password = newPass;
        saveData();
        alert('تم تحديث كلمة المرور بنجاح! 💾');
        closeChangePasswordModal();
    }
}

// إدارة مستخدمي الإدارة من قبل المدير العام
function openUserManagementModal() {
    renderAdminUsersTable();
    document.getElementById('user-management-modal').style.display = 'flex';
}

function closeUserManagementModal() {
    document.getElementById('user-management-modal').style.display = 'none';
    document.getElementById('add-new-user-form').reset();
}

function renderAdminUsersTable() {
    const tbody = document.querySelector('#users-admin-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    state.users.forEach(u => {
        const tr = document.createElement('tr');
        
        const deleteButton = u.username === 'admin' 
            ? '<span style="color: var(--text-muted);">قفل 🔒</span>' 
            : `<button class="btn-del" onclick="deleteUserAccount('${u.username}')">✖</button>`;
            
        tr.innerHTML = `
            <td><strong>${u.username}</strong></td>
            <td>${u.roleLabel || u.role}</td>
            <td style="font-family: var(--font-en); font-weight: bold;">${u.password}</td>
            <td>${deleteButton}</td>
        `;
        tbody.appendChild(tr);
    });
}

function processAddNewUser(e) {
    e.preventDefault();
    
    const name = document.getElementById('new-user-name').value.trim().toLowerCase();
    const role = document.getElementById('new-user-role').value;
    const pass = document.getElementById('new-user-pass').value;
    
    if (!name || !pass) return;
    
    if (state.users.some(u => u.username === name)) {
        alert('اسم المستخدم هذا موجود مسبقاً! يرجى اختيار اسم مستخدم آخر.');
        return;
    }
    
    let roleLabel = '';
    if (role === 'admin') roleLabel = 'مدير عام 👑';
    else if (role === 'accountant') roleLabel = 'محاسب 💼';
    else if (role === 'viewer') roleLabel = 'مراقب 👁️';
    
    const newUser = {
        username: name,
        password: pass,
        role: role,
        roleLabel: roleLabel
    };
    state.users.push(newUser);
    
    saveData();
    if (isFirebaseActive) {
        db.collection('users').doc(newUser.username).set(newUser);
    }
    document.getElementById('add-new-user-form').reset();
    renderAdminUsersTable();
    alert('تم إنشاء حساب الموظف بنجاح! 🚀');
}

function deleteUserAccount(username) {
    if (username === 'admin') return;
    
    if (confirm(`هل أنت متأكد من رغبتك في حذف حساب المستخدم [${username}] بالكامل؟`)) {
        const index = state.users.findIndex(u => u.username === username);
        if (index !== -1) {
            if (isFirebaseActive) {
                const u = state.users[index];
                const docId = u.uid || u.username;
                db.collection('users').doc(docId).delete();
            }
            state.users.splice(index, 1);
            saveData();
            renderAdminUsersTable();
        }
    }
}

// ==========================================================================
// ⚙️ محرك إدارة باقات الإنترنت الشهرية للمدير
// ==========================================================================

function openPackagesManagementModal() {
    renderAdminPackagesTable();
    document.getElementById('packages-management-modal').style.display = 'flex';
}

function closePackagesManagementModal() {
    document.getElementById('packages-management-modal').style.display = 'none';
    document.getElementById('add-new-package-form').reset();
}

function renderAdminPackagesTable() {
    const tbody = document.querySelector('#packages-admin-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    state.packages.forEach(pkg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>📶 ${pkg.name}</strong></td>
            <td style="font-family: var(--font-en); font-weight: bold; color: var(--warning);">${pkg.price} ₪</td>
            <td><button class="btn-del" onclick="deletePackageItem('${pkg.id}')">✖</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    if (state.packages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state-msg">لا توجد باقات مدخلة، يرجى إضافة باقة</td></tr>';
    }
}

function processAddNewPackage(e) {
    e.preventDefault();
    if (state.currentUser.role !== 'admin') return;
    
    const name = document.getElementById('new-pkg-name').value.trim();
    const price = parseInt(document.getElementById('new-pkg-price').value);
    
    if (!name || isNaN(price) || price <= 0) return;
    
    const newId = 'pkg_' + Date.now();
    const newPkg = {
        id: newId,
        name: name,
        price: price
    };
    state.packages.push(newPkg);
    
    saveData();
    if (isFirebaseActive) {
        db.collection('packages').doc(newId).set(newPkg);
    }
    document.getElementById('add-new-package-form').reset();
    renderAdminPackagesTable();
    alert('تم إضافة باقة السرعة بنجاح وتفعيلها في التجديد! 🚀');
}

function deletePackageItem(pkgId) {
    if (state.currentUser.role !== 'admin') return;
    
    if (confirm('هل أنت متأكد من حذف باقة السرعة هذه؟ لن تتمكن من تجديد الحسابات بها بعد الآن.')) {
        const index = state.packages.findIndex(p => p.id === pkgId);
        if (index !== -1) {
            if (isFirebaseActive) {
                db.collection('packages').doc(pkgId).delete();
            }
            state.packages.splice(index, 1);
            saveData();
            renderAdminPackagesTable();
        }
    }
}


// ==========================================================================
// 6. إدارة شاشات التنقل (Screen Navigation)
// ==========================================================================
function switchScreen(screenId, navBtn) {
    const screens = document.querySelectorAll('.app-screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    if (navBtn) {
        navBtn.classList.add('active');
    }
    
    if (screenId === 'dashboard') {
        renderDashboard();
    } else if (screenId === 'history') {
        renderHistory();
    } else if (screenId === 'sellers') {
        renderSellers();
    } else if (screenId === 'reports') {
        renderReports();
    }
}

// ==========================================================================
// 7. لوحة التحكم والملخص المالي (Dashboard Screen)
// ==========================================================================
function renderDashboard() {
    let totalRevenue = 0;
    let totalExpense = 0;
    
    state.transactions.forEach(t => {
        if (t.type === 'revenue') totalRevenue += parseFloat(t.amount);
        if (t.type === 'expense') totalExpense += parseFloat(t.amount);
    });
    
    const netProfit = totalRevenue - totalExpense;
    
    const netValEl = document.getElementById('net-profit-val');
    const totalRevEl = document.getElementById('total-revenue-val');
    const totalExpEl = document.getElementById('total-expense-val');
    const trendEl = document.getElementById('net-profit-trend');
    
    if (netValEl) {
        netValEl.innerText = netProfit.toFixed(2);
        netValEl.className = 'profit-value ' + (netProfit >= 0 ? 'positive' : 'negative');
    }
    if (totalRevEl) totalRevEl.innerText = totalRevenue.toFixed(2);
    if (totalExpEl) totalExpEl.innerText = totalExpense.toFixed(2);
    
    if (trendEl) {
        if (state.transactions.length === 0) {
            trendEl.className = 'profit-trend';
            trendEl.innerHTML = '<span class="trend-icon">─</span> <span class="trend-text">لا توجد عمليات مسجلة</span>';
        } else if (netProfit > 0) {
            trendEl.className = 'profit-trend positive';
            trendEl.innerHTML = '<span class="trend-icon">▲</span> <span class="trend-text">صافي أرباح الشبكة ممتاز 🚀</span>';
        } else if (netProfit < 0) {
            trendEl.className = 'profit-trend negative';
            trendEl.innerHTML = '<span class="trend-icon">▼</span> <span class="trend-text">خسائر أو استثمارات مرتفعة ⚠️</span>';
        } else {
            trendEl.className = 'profit-trend';
            trendEl.innerHTML = '<span class="trend-icon">─</span> <span class="trend-text">الإيرادات مساوية للمصاريف بالضبط</span>';
        }
    }
    
    // تعبئة المشتركين في القائمة المصغرة بلوحة التحكم
    const miniSellersEl = document.getElementById('dashboard-distributors-list');
    if (miniSellersEl) {
        miniSellersEl.innerHTML = '';
        
        const activeDebts = state.sellers.filter(s => s.balance > 0);
        
        if (activeDebts.length === 0) {
            miniSellersEl.innerHTML = '<p class="empty-state-msg">جميع المشتركين حساباتهم مسددة بالكامل ✔️</p>';
        } else {
            activeDebts.sort((a,b) => b.balance - a.balance).slice(0, 3).forEach(seller => {
                const item = document.createElement('div');
                item.className = 'mini-distributor-item';
                item.innerHTML = `
                    <strong>📶 ${seller.name}</strong>
                    <span>${seller.balance.toFixed(2)} ₪</span>
                `;
                miniSellersEl.appendChild(item);
            });
        }
    }
    
    renderDashboardTrendChart();
}

// رسم مخطط الأعمدة المالي بالرئيسية
function renderDashboardTrendChart() {
    const ctx = document.getElementById('dashboardTrendChart');
    if (!ctx) return;
    
    const labels = [];
    const revenueData = [];
    const expenseData = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const weekday = d.toLocaleDateString('ar-EG', { weekday: 'short' });
        labels.push(weekday);
        
        let dayRev = 0;
        let dayExp = 0;
        
        state.transactions.forEach(t => {
            if (t.date.split('T')[0] === dateStr) {
                if (t.type === 'revenue') dayRev += parseFloat(t.amount);
                if (t.type === 'expense') dayExp += parseFloat(t.amount);
            }
        });
        
        revenueData.push(dayRev);
        expenseData.push(dayExp);
    }
    
    if (dashboardChart) {
        dashboardChart.destroy();
    }
    
    dashboardChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'إيرادات 📥',
                    data: revenueData,
                    backgroundColor: '#10b981',
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'مصاريف 📤',
                    data: expenseData,
                    backgroundColor: '#f43f5e',
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Cairo', size: 10, weight: 'bold' }
                    }
                },
                tooltip: {
                    titleFont: { family: 'Cairo' },
                    bodyFont: { family: 'Cairo' }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { family: 'Cairo', size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 10 } }
                }
            }
        }
    });
}

// ==========================================================================
// 8. سجل الحركات والعمليات (History Screen)
// ==========================================================================
function renderHistory() {
    const listEl = document.getElementById('history-list');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    const searchVal = document.getElementById('history-search').value.trim().toLowerCase();
    
    const sortedTrans = [...state.transactions].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    let renderedCount = 0;
    
    sortedTrans.forEach(t => {
        if (state.historyFilter !== 'all' && t.type !== state.historyFilter) return;
        
        const catObj = categories[t.type].find(c => c.id === t.category);
        const catLabel = catObj ? catObj.label : '';
        const desc = t.description.toLowerCase();
        
        if (searchVal && !catLabel.toLowerCase().includes(searchVal) && !desc.includes(searchVal)) {
            return;
        }
        
        renderedCount++;
        
        const item = document.createElement('div');
        item.className = `transaction-item ${t.type}`;
        
        const tDate = new Date(t.date);
        const timeStr = tDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        const dateStr = tDate.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
        
        const icon = catObj ? catObj.icon : '💰';
        
        let actionButtons = '';
        if (state.currentUser.role === 'admin') {
            actionButtons = `
                <button class="trans-action-btn edit" onclick="editTransaction('${t.id}')" title="تعديل">✏️</button>
                <button class="trans-action-btn delete" onclick="deleteTransaction('${t.id}')" title="حذف">🗑️</button>
            `;
        } else if (state.currentUser.role === 'accountant') {
            actionButtons = `
                <button class="trans-action-btn edit" onclick="editTransaction('${t.id}')" title="تعديل">✏️</button>
            `;
        }
        
        item.innerHTML = `
            <div class="trans-left-area">
                <div class="trans-icon-bg">${icon}</div>
                <div class="trans-details">
                    <span class="trans-cat-name">${catObj ? catObj.label.split(' ')[1] : t.category}</span>
                    <span class="trans-desc-text">${t.description || 'لا يوجد بيان'}</span>
                    <span class="trans-date-text">📅 ${dateStr} • ⏰ ${timeStr}</span>
                </div>
            </div>
            <div class="trans-right-area">
                <span class="trans-amount-display">${t.type === 'revenue' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)} ₪</span>
                <div class="trans-actions">
                    ${actionButtons}
                </div>
            </div>
        `;
        
        listEl.appendChild(item);
    });
    
    if (renderedCount === 0) {
        listEl.innerHTML = '<p class="empty-state-msg" style="padding: 40px 0;">لا توجد عمليات مطابقة لخيارات التصفية</p>';
    }
}

function setHistoryFilter(filter, btn) {
    state.historyFilter = filter;
    
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    renderHistory();
}

function filterTransactions() {
    renderHistory();
}

// ==========================================================================
// 9. إضافة وتعديل الحركات المالية (Bottom Sheet Actions)
// ==========================================================================
function openQuickAdd() {
    if (state.currentUser.role === 'viewer') return;
    
    document.getElementById('transaction-form').reset();
    document.getElementById('trans-id').value = '';
    document.getElementById('sheet-title').innerText = 'إضافة عملية مالية جديدة';
    
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('trans-date').value = now.toISOString().slice(0, 16);
    
    document.getElementById('add-transaction-sheet').style.display = 'flex';
    setTimeout(() => {
        document.querySelector('.bottom-sheet-container').style.transform = 'translateY(0)';
    }, 10);
    
    toggleFormCategories();
}

function closeQuickAdd() {
    document.querySelector('.bottom-sheet-container').style.transform = 'translateY(100%)';
    setTimeout(() => {
        document.getElementById('add-transaction-sheet').style.display = 'none';
    }, 300);
}

// تغيير الفئات المتاحة بناءً على إيراد/مصروف
function toggleFormCategories() {
    const type = document.querySelector('input[name="trans-type"]:checked').value;
    const catSelect = document.getElementById('trans-category');
    
    if (!catSelect) return;
    
    catSelect.innerHTML = '';
    
    categories[type].forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.innerText = cat.label;
        catSelect.appendChild(opt);
    });
    
    handleCategoryChange();
}

// عندما تتغير الفئة، نتحقق مما إذا كان يلزم ربطها بمشترك (مثل دفعات الاشتراكات)
function handleCategoryChange() {
    const category = document.getElementById('trans-category').value;
    const sellerGroup = document.getElementById('form-seller-select-group');
    const sellerSelect = document.getElementById('trans-seller-id');
    
    if (category === 'home_subs') {
        sellerGroup.style.display = 'flex';
        sellerSelect.innerHTML = '';
        state.sellers.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.innerText = s.name;
            sellerSelect.appendChild(opt);
        });
    } else {
        sellerGroup.style.display = 'none';
    }
}

// حفظ أو تعديل الحركة المالية
function saveTransaction(e) {
    e.preventDefault();
    if (state.currentUser.role === 'viewer') return;
    
    const id = document.getElementById('trans-id').value;
    const type = document.querySelector('input[name="trans-type"]:checked').value;
    const category = document.getElementById('trans-category').value;
    const amount = parseFloat(document.getElementById('trans-amount').value);
    const date = document.getElementById('trans-date').value;
    const description = document.getElementById('trans-description').value.trim();
    const sellerId = category === 'home_subs' ? document.getElementById('trans-seller-id').value : null;
    
    if (isNaN(amount) || amount <= 0) {
        alert('يرجى إدخال مبلغ مالي صحيح!');
        return;
    }
    
    let activeId = id;
    if (id) {
        const index = state.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            const oldTrans = state.transactions[index];
            if (oldTrans.category === 'home_subs' && oldTrans.sellerId) {
                adjustSellerLedgerOffline(oldTrans.sellerId, 'payment_refund', oldTrans.amount);
            }
            
            state.transactions[index] = { id, type, category, amount, date, description, sellerId };
            
            if (category === 'home_subs' && sellerId) {
                adjustSellerLedgerOffline(sellerId, 'payment', amount, date);
            }
        }
    } else {
        const newId = 'trans_' + Date.now();
        state.transactions.push({ id: newId, type, category, amount, date, description, sellerId });
        
        if (category === 'home_subs' && sellerId) {
            adjustSellerLedgerOffline(sellerId, 'payment', amount, date);
        }
    }
    
    saveData();
    
    // المزامنة مع Firestore
    if (isFirebaseActive) {
        db.collection('transactions').doc(activeId).set({ id: activeId, type, category, amount, date, description, sellerId });
        if (category === 'home_subs' && sellerId) {
            const seller = state.sellers.find(s => s.id === sellerId);
            if (seller) db.collection('sellers').doc(sellerId).set(seller);
        }
    }
    
    closeQuickAdd();
    
    renderDashboard();
    renderHistory();
}

// تعديل معاملة
function editTransaction(id) {
    if (state.currentUser.role === 'viewer') return;
    
    const t = state.transactions.find(trans => trans.id === id);
    if (!t) return;
    
    openQuickAdd();
    
    document.getElementById('trans-id').value = t.id;
    document.getElementById('sheet-title').innerText = 'تعديل العملية المالية';
    
    document.getElementById(`type-${t.type}`).checked = true;
    toggleFormCategories();
    
    document.getElementById('trans-category').value = t.category;
    handleCategoryChange();
    
    document.getElementById('trans-amount').value = t.amount;
    document.getElementById('trans-date').value = t.date.slice(0, 16);
    document.getElementById('trans-description').value = t.description;
    
    if (t.category === 'home_subs' && t.sellerId) {
        document.getElementById('trans-seller-id').value = t.sellerId;
    }
}

// حذف معاملة مالية
function deleteTransaction(id) {
    if (state.currentUser.role !== 'admin') {
        alert('صلاحية الحذف متاحة للمدير العام فقط!');
        return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذه المعاملة بشكل نهائي؟')) return;
    
    const index = state.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        const t = state.transactions[index];
        if (t.category === 'home_subs' && t.sellerId) {
            adjustSellerLedgerOffline(t.sellerId, 'payment_refund', t.amount);
        }
        
        // المزامنة مع Firestore
        if (isFirebaseActive) {
            db.collection('transactions').doc(id).delete();
            if (t.category === 'home_subs' && t.sellerId) {
                const seller = state.sellers.find(s => s.id === t.sellerId);
                if (seller) db.collection('sellers').doc(t.sellerId).set(seller);
            }
        }
        
        state.transactions.splice(index, 1);
        saveData();
        
        renderDashboard();
        renderHistory();
    }
}

// ==========================================================================
// 10. شاشة الاشتراكات (Sellers Screen renamed UI)
// ==========================================================================
function renderSellers() {
    const listEl = document.getElementById('sellers-list');
    const totalDebtEl = document.getElementById('total-sellers-debt');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    let totalDebt = 0;
    
    state.sellers.forEach(seller => {
        totalDebt += parseFloat(seller.balance);
        
        const card = document.createElement('div');
        card.className = 'seller-card-item';
        
        const avatarLetter = seller.name.trim().charAt(0);
        const debtClass = seller.balance > 0 ? '' : 'zero';
        
        // إظهار أزرار التعديل والحذف بناءً على الصلاحيات
        let deleteBtnHtml = '';
        let editBtnHtml = '';
        
        if (state.currentUser && state.currentUser.role === 'admin') {
            deleteBtnHtml = `<button class="seller-delete-btn" onclick="deleteSubscriberAccount('${seller.id}')" title="حذف المشترك">🗑️</button>`;
        }
        if (state.currentUser && state.currentUser.role !== 'viewer') {
            editBtnHtml = `<button class="seller-open-ledger-btn" style="color: var(--warning); border-color: rgba(245, 158, 11, 0.2);" onclick="editSubscriberAccount('${seller.id}')" title="تعديل بيانات المشترك">تعديل ✏️</button>`;
        }
        
        card.innerHTML = `
            <div class="seller-card-left">
                <div class="seller-avatar-icon">${avatarLetter}</div>
                <div class="seller-card-info">
                    <span class="seller-card-name">${seller.name}</span>
                    <span class="seller-card-phone">📞 ${seller.phone || 'بدون هاتف'}</span>
                    <span class="seller-card-location">📍 ${seller.location || 'غير محدد'}</span>
                </div>
            </div>
            <div class="seller-card-right">
                <span class="seller-card-debt ${debtClass}">${seller.balance.toFixed(2)} ₪</span>
                <div style="display: flex; gap: 4px; align-items: center; margin-top: 4px; flex-wrap: wrap; justify-content: flex-end;">
                    <button class="seller-open-ledger-btn" onclick="openSellerLedger('${seller.id}')">كشف الحساب 📝</button>
                    ${editBtnHtml}
                    ${deleteBtnHtml}
                </div>
            </div>
        `;
        listEl.appendChild(card);
    });
    
    if (totalDebtEl) totalDebtEl.innerHTML = `${totalDebt.toFixed(2)} <small>شيكل</small>`;
}

// وظيفة حذف مشترك بالكامل للادمن
function deleteSubscriberAccount(sellerId) {
    if (state.currentUser.role !== 'admin') return;
    
    const seller = state.sellers.find(s => s.id === sellerId);
    if (!seller) return;
    
    // تنبيه في حال وجود مستحقات ذمم مالية
    if (seller.balance > 0) {
        if (!confirm(`⚠️ تنبيه هام: المشترك [${seller.name}] لديه مستحقات غير مسددة بقيمة (${seller.balance.toFixed(2)} شيكل).\nهل أنت متأكد من رغبتك في حذفه بالرغم من ذلك؟`)) {
            return;
        }
    } else {
        if (!confirm(`هل أنت متأكد من حذف حساب المشترك [${seller.name}] بالكامل؟`)) {
            return;
        }
    }
    
    const index = state.sellers.findIndex(s => s.id === sellerId);
    if (index !== -1) {
        if (isFirebaseActive) {
            db.collection('sellers').doc(sellerId).delete();
        }
        state.sellers.splice(index, 1);
        saveData();
        renderSellers();
        renderDashboard(); // لتحديث إحصائيات لوحة التحكم بالرئيسية
    }
}

// فتح وإغلاق نافذة إضافة مشترك
function showNewSellerModal() {
    if (state.currentUser.role === 'viewer') return;
    document.getElementById('edit-seller-id').value = '';
    document.getElementById('add-seller-modal-title').innerText = 'إضافة مشترك منزلي / شهري جديد';
    document.getElementById('add-seller-submit-btn').innerText = 'إضافة المشترك للشبكة 🚀';
    document.getElementById('add-seller-modal').style.display = 'flex';
}

function closeNewSellerModal() {
    document.getElementById('add-seller-modal').style.display = 'none';
    document.getElementById('edit-seller-id').value = '';
    document.getElementById('new-seller-form').reset();
}

function editSubscriberAccount(sellerId) {
    if (state.currentUser.role === 'viewer') return;
    
    const seller = state.sellers.find(s => s.id === sellerId);
    if (!seller) return;
    
    document.getElementById('edit-seller-id').value = seller.id;
    document.getElementById('new-seller-name').value = seller.name;
    document.getElementById('new-seller-phone').value = seller.phone === 'بدون هاتف' ? '' : seller.phone;
    document.getElementById('new-seller-location').value = seller.location === 'غير محدد' ? '' : seller.location;
    
    document.getElementById('add-seller-modal-title').innerText = 'تعديل بيانات المشترك ✏️';
    document.getElementById('add-seller-submit-btn').innerText = 'تحديث بيانات المشترك 💾';
    
    document.getElementById('add-seller-modal').style.display = 'flex';
}

// حفظ المشترك الجديد أو تعديل مشترك موجود
function saveNewSeller(e) {
    e.preventDefault();
    if (state.currentUser.role === 'viewer') return;
    
    const name = document.getElementById('new-seller-name').value.trim();
    const phone = document.getElementById('new-seller-phone').value.trim();
    const location = document.getElementById('new-seller-location').value.trim();
    const editId = document.getElementById('edit-seller-id').value;
    
    if (!name) return;
    
    if (editId) {
        // تعديل مشترك موجود
        const index = state.sellers.findIndex(s => s.id === editId);
        if (index !== -1) {
            state.sellers[index].name = name;
            state.sellers[index].phone = phone || 'بدون هاتف';
            state.sellers[index].location = location || 'غير محدد';
            
            saveData();
            
            if (isFirebaseActive) {
                db.collection('sellers').doc(editId).set(state.sellers[index]);
            }
        }
    } else {
        // إضافة مشترك جديد
        const newId = 'seller_' + Date.now();
        const newSeller = {
            id: newId,
            name: name,
            phone: phone || 'بدون هاتف',
            location: location || 'غير محدد',
            balance: 0,
            history: []
        };
        state.sellers.push(newSeller);
        
        saveData();
        
        if (isFirebaseActive) {
            db.collection('sellers').doc(newId).set(newSeller);
        }
    }
    
    closeNewSellerModal();
    renderSellers();
    renderDashboard();
}

// ==========================================================================
// 11. إدارة كشف الحساب التفصيلي للمشترك (Ledger Detail Modal)
// ==========================================================================
function openSellerLedger(sellerId) {
    const seller = state.sellers.find(s => s.id === sellerId);
    if (!seller) return;
    
    activeSellerId = sellerId;
    
    document.getElementById('ledger-title').innerText = `اشتراك: ${seller.name}`;
    document.getElementById('ledger-subtitle').innerText = `العنوان: ${seller.location} • 📞 ${seller.phone}`;
    
    updateLedgerUI(seller);
    
    document.getElementById('seller-ledger-modal').style.display = 'flex';
}

function closeSellerLedger() {
    document.getElementById('seller-ledger-modal').style.display = 'none';
    activeSellerId = null;
    renderSellers();
}

// تحديث واجهة كشف الحساب بالأرقام والجدول للمشترك
function updateLedgerUI(seller) {
    let totalDelivered = 0;
    let totalPaid = 0;
    
    seller.history.forEach(item => {
        if (item.type === 'delivered') totalDelivered += parseFloat(item.amount);
        if (item.type === 'payment') totalPaid += parseFloat(item.amount);
    });
    
    const balance = totalDelivered - totalPaid;
    seller.balance = balance;
    saveData();
    
    document.getElementById('ledger-balance-display').innerText = `${balance.toFixed(2)} شيكل`;
    document.getElementById('ledger-total-delivered').innerText = totalDelivered.toFixed(2);
    document.getElementById('ledger-total-paid').innerText = totalPaid.toFixed(2);
    
    const tbody = document.querySelector('#ledger-history-table tbody');
    tbody.innerHTML = '';
    
    const sortedHistory = [...seller.history].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    let currentBalanceAccum = balance;
    
    sortedHistory.forEach((item) => {
        const tr = document.createElement('tr');
        const dateFormatted = new Date(item.date).toLocaleDateString('ar-EG', { month: '2-digit', day: '2-digit' });
        
        const typeLabel = item.type === 'delivered' ? '⚡ تجديد باقة' : '💰 دفعة مسددة';
        const typeClass = item.type === 'delivered' ? 'delivered' : 'paid';
        
        const deleteBtn = state.currentUser.role === 'admin' 
            ? `<button class="btn-del" onclick="deleteSellerHistoryItem('${item.id}')">✖</button>`
            : '';
        
        tr.innerHTML = `
            <td class="date-col">${dateFormatted}</td>
            <td class="${typeClass}">${typeLabel}</td>
            <td class="${typeClass}">${item.type === 'delivered' ? '+' : '-'}${parseFloat(item.amount).toFixed(0)} ₪</td>
            <td class="bal">${currentBalanceAccum.toFixed(0)} ₪</td>
            <td>${deleteBtn}</td>
        `;
        
        if (item.type === 'delivered') {
            currentBalanceAccum -= parseFloat(item.amount);
        } else {
            currentBalanceAccum += parseFloat(item.amount);
        }
        
        tbody.appendChild(tr);
    });
    
    if (seller.history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state-msg">لا توجد حركات مسجلة لهذا المشترك</td></tr>';
    }
}

// ضبط حساب المشترك عند تسجيل حركات مالية عامة خارج المودال
function adjustSellerLedgerOffline(sellerId, type, amount, date = null) {
    const seller = state.sellers.find(s => s.id === sellerId);
    if (!seller) return;
    
    const transDate = date || new Date().toISOString();
    
    if (type === 'payment') {
        seller.history.push({
            id: 'ledger_act_' + Date.now() + Math.floor(Math.random()*100),
            type: 'payment',
            amount: amount,
            date: transDate,
            description: 'دفعة مستلمة من المشترك'
        });
        seller.balance = parseFloat(seller.balance) - amount;
    } else if (type === 'payment_refund') {
        const hIndex = seller.history.findIndex(h => h.type === 'payment' && parseFloat(h.amount) === parseFloat(amount));
        if (hIndex !== -1) {
            seller.history.splice(hIndex, 1);
            seller.balance = parseFloat(seller.balance) + amount;
        }
    }
    
    saveData();
}

// ⚡ تجديد الاشتراك للمشترك (عرض الباقات ديناميكياً)
function openDeliverCardsSheet() {
    if (state.currentUser.role === 'viewer') return;
    document.getElementById('deliver-cards-form').reset();
    
    // إنشاء خيارات باقات التجديد ديناميكياً من الذاكرة المحلية
    const container = document.getElementById('renew-packages-dynamic-container');
    if (container) {
        container.innerHTML = '';
        state.packages.forEach((pkg, index) => {
            const row = document.createElement('div');
            row.className = 'calc-row';
            row.style.marginBottom = '6px';
            const checked = index === 0 ? 'checked' : '';
            
            row.innerHTML = `
                <input type="radio" name="pkg-selector" id="pkg-${pkg.id}" value="${pkg.price}" ${checked} onchange="selectPackagePrice(${pkg.price})">
                <label for="pkg-${pkg.id}" class="card-tag price-3" style="flex-grow: 1; text-align: right; cursor: pointer;">باقة ${pkg.name} (${pkg.price} ₪/الشهر)</label>
            `;
            container.appendChild(row);
        });
        
        // خيار قيمة مخصصة
        const customRow = document.createElement('div');
        customRow.className = 'calc-row';
        customRow.innerHTML = `
            <input type="radio" name="pkg-selector" id="pkg-custom" value="custom" onchange="selectPackagePrice('custom')">
            <label for="pkg-custom" class="card-tag" style="background: rgba(255,255,255,0.05); color: #fff; flex-grow: 1; text-align: right; cursor: pointer;">باقة أو قيمة مخصصة</label>
        `;
        container.appendChild(customRow);
    }
    
    // ضبط القيمة الافتراضية لأول باقة
    if (state.packages.length > 0) {
        document.getElementById('delivered-custom-total').value = state.packages[0].price;
    } else {
        document.getElementById('delivered-custom-total').value = 0;
    }
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('delivered-date').value = today;
    
    document.getElementById('deliver-cards-modal').style.display = 'flex';
}

function closeDeliverCards() {
    document.getElementById('deliver-cards-modal').style.display = 'none';
}

function selectPackagePrice(price) {
    const customTotalInput = document.getElementById('delivered-custom-total');
    if (price === 'custom') {
        customTotalInput.value = '';
        customTotalInput.focus();
    } else {
        customTotalInput.value = price;
    }
}

function processDeliverCards(e) {
    e.preventDefault();
    if (state.currentUser.role === 'viewer') return;
    
    const seller = state.sellers.find(s => s.id === activeSellerId);
    if (!seller) return;
    
    const totalAmount = parseFloat(document.getElementById('delivered-custom-total').value);
    const date = document.getElementById('delivered-date').value;
    
    if (isNaN(totalAmount) || totalAmount <= 0) {
        alert('برجاء إدخال قيمة صحيحة للباقة!');
        return;
    }
    
    seller.history.push({
        id: 'ledger_act_' + Date.now(),
        type: 'delivered',
        amount: totalAmount,
        date: date + 'T12:00:00',
        description: `تجديد باقة شهرية بقيمة ${totalAmount} ₪`
    });
    
    saveData();
    if (isFirebaseActive) {
        db.collection('sellers').doc(activeSellerId).set(seller);
    }
    closeDeliverCards();
    updateLedgerUI(seller);
}

// 💵 استلام دفعة نقدية من المشترك
function openReceiveCashSheet() {
    if (state.currentUser.role === 'viewer') return;
    document.getElementById('receive-cash-form').reset();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('cash-date').value = today;
    
    document.getElementById('receive-cash-modal').style.display = 'flex';
}

function closeReceiveCash() {
    document.getElementById('receive-cash-modal').style.display = 'none';
}

function processReceiveCash(e) {
    e.preventDefault();
    if (state.currentUser.role === 'viewer') return;
    
    const seller = state.sellers.find(s => s.id === activeSellerId);
    if (!seller) return;
    
    const amount = parseFloat(document.getElementById('cash-amount').value);
    const date = document.getElementById('cash-date').value;
    
    if (isNaN(amount) || amount <= 0) {
        alert('يرجى إدخال مبلغ صحيح!');
        return;
    }
    
    const transDate = date + 'T12:00:00';
    
    seller.history.push({
        id: 'ledger_act_' + Date.now(),
        type: 'payment',
        amount: amount,
        date: transDate,
        description: 'دفعة مستلمة نقداً'
    });
    
    // تسجيل العملية كإيراد فوري تحت فئة الاشتراكات المنزلية
    const newTransId = 'trans_' + Date.now();
    state.transactions.push({
        id: newTransId,
        type: 'revenue',
        category: 'home_subs',
        amount: amount,
        date: transDate,
        description: `تسديد اشتراك المشترك: ${seller.name}`,
        sellerId: seller.id
    });
    
    saveData();
    if (isFirebaseActive) {
        db.collection('sellers').doc(activeSellerId).set(seller);
        db.collection('transactions').doc(newTransId).set(state.transactions[state.transactions.length - 1]);
    }
    closeReceiveCash();
    updateLedgerUI(seller);
}

// حذف عنصر من كشف حساب المشترك يدوياً (للمدير فقط)
function deleteSellerHistoryItem(itemId) {
    if (state.currentUser.role !== 'admin') return;
    
    if (!confirm('هل تريد حذف هذه العملية من كشف حساب المشترك؟ تذكر أن هذا لن يحذف الحركات المالية العامة المقابلة تلقائياً لسلامة الدفاتر.')) return;
    
    const seller = state.sellers.find(s => s.id === activeSellerId);
    if (!seller) return;
    
    const index = seller.history.findIndex(h => h.id === itemId);
    if (index !== -1) {
        seller.history.splice(index, 1);
        saveData();
        if (isFirebaseActive) {
            db.collection('sellers').doc(activeSellerId).set(seller);
        }
        updateLedgerUI(seller);
    }
}

// ==========================================================================
// 12. شاشة التقارير والتحليلات (Reports Screen)
// ==========================================================================
function renderReports() {
    renderCategoryCharts();
    renderMonthlyReportTable();
}

function renderCategoryCharts() {
    const revCtx = document.getElementById('revenuePieChart');
    const expCtx = document.getElementById('expensePieChart');
    
    if (!revCtx || !expCtx) return;
    
    const revLabels = [];
    const revData = [];
    const revColors = ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0'];
    
    categories.revenue.forEach(cat => {
        let catSum = 0;
        state.transactions.forEach(t => {
            if (t.type === 'revenue' && t.category === cat.id) {
                catSum += parseFloat(t.amount);
            }
        });
        if (catSum > 0) {
            revLabels.push(cat.label.split(' ')[1]);
            revData.push(catSum);
        }
    });
    
    const expLabels = [];
    const expData = [];
    const expColors = ['#f43f5e', '#e11d48', '#fda4af', '#f87171', '#ef4444', '#b91c1c', '#fca5a5'];
    
    categories.expense.forEach(cat => {
        let catSum = 0;
        state.transactions.forEach(t => {
            if (t.type === 'expense' && t.category === cat.id) {
                catSum += parseFloat(t.amount);
            }
        });
        if (catSum > 0) {
            expLabels.push(cat.label.split(' ')[1]);
            expData.push(catSum);
        }
    });
    
    if (revenueChartInstance) revenueChartInstance.destroy();
    if (expenseChartInstance) expenseChartInstance.destroy();
    
    if (revData.length > 0) {
        revenueChartInstance = new Chart(revCtx, {
            type: 'doughnut',
            data: {
                labels: revLabels,
                datasets: [{
                    data: revData,
                    backgroundColor: revColors.slice(0, revData.length),
                    borderWidth: 2,
                    borderColor: '#0d1220'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#94a3b8', font: { family: 'Cairo', size: 10 } }
                    }
                }
            }
        });
    } else {
        revCtx.getContext('2d').clearRect(0, 0, revCtx.width, revCtx.height);
    }
    
    if (expData.length > 0) {
        expenseChartInstance = new Chart(expCtx, {
            type: 'doughnut',
            data: {
                labels: expLabels,
                datasets: [{
                    data: expData,
                    backgroundColor: expColors.slice(0, expData.length),
                    borderWidth: 2,
                    borderColor: '#0d1220'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#94a3b8', font: { family: 'Cairo', size: 10 } }
                    }
                }
            }
        });
    } else {
        expCtx.getContext('2d').clearRect(0, 0, expCtx.width, expCtx.height);
    }
}

function renderMonthlyReportTable() {
    const tbody = document.querySelector('#monthly-report-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const monthlySummary = {};
    
    state.transactions.forEach(t => {
        const dateObj = new Date(t.date);
        const monthKey = dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
        
        if (!monthlySummary[monthKey]) {
            monthlySummary[monthKey] = { revenue: 0, expense: 0 };
        }
        
        if (t.type === 'revenue') monthlySummary[monthKey].revenue += parseFloat(t.amount);
        if (t.type === 'expense') monthlySummary[monthKey].expense += parseFloat(t.amount);
    });
    
    const keys = Object.keys(monthlySummary);
    
    keys.forEach(month => {
        const rev = monthlySummary[month].revenue;
        const exp = monthlySummary[month].expense;
        const net = rev - exp;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${month}</strong></td>
            <td class="rev">+${rev.toFixed(1)} ₪</td>
            <td class="exp">-${exp.toFixed(1)} ₪</td>
            <td class="net ${net >= 0 ? 'positive' : 'negative'}">${net.toFixed(1)} ₪</td>
        `;
        tbody.appendChild(tr);
    });
    
    if (keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state-msg">لا توجد حركات مسجلة لإنشاء التقرير الشهري</td></tr>';
    }
}

// ==========================================================================
// 13. النسخ الاحتياطي وإدارة البيانات (Backup & Settings Screen)
// ==========================================================================
function exportDataBackup() {
    if (state.currentUser.role === 'viewer') return;
    
    const dataStr = JSON.stringify({
        version: '1.3.0',
        transactions: state.transactions,
        sellers: state.sellers,
        users: state.users,
        packages: state.packages,
        exportDate: new Date().toISOString()
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `masternet_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function importDataBackup(event) {
    if (state.currentUser.role === 'viewer') return;
    
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.transactions && data.sellers) {
                if (confirm('تنبيه: سيؤدي استرجاع هذه النسخة الاحتياطية إلى استبدال كافة البيانات الحالية بالكامل. هل تريد الاستمرار؟')) {
                    state.transactions = data.transactions;
                    state.sellers = data.sellers;
                    if (data.users) state.users = data.users;
                    if (data.packages) state.packages = data.packages;
                    saveData();
                    
                    if (isFirebaseActive) {
                        const batch = db.batch();
                        
                        data.transactions.forEach(t => {
                            const ref = db.collection('transactions').doc(t.id);
                            batch.set(ref, t);
                        });
                        
                        data.sellers.forEach(s => {
                            const ref = db.collection('sellers').doc(s.id);
                            batch.set(ref, s);
                        });
                        
                        if (data.packages) {
                            data.packages.forEach(p => {
                                const ref = db.collection('packages').doc(p.id);
                                batch.set(ref, p);
                            });
                        }
                        
                        if (data.users) {
                            data.users.forEach(u => {
                                const ref = db.collection('users').doc(u.uid || u.username);
                                batch.set(ref, u);
                            });
                        }
                        
                        batch.commit().then(() => {
                            alert('تم استيراد البيانات ورفعها للمزامنة السحابية بنجاح! سيتم إعادة تحميل التطبيق للتحديث.');
                            window.location.reload();
                        }).catch(err => {
                            console.error("Batch write failed:", err);
                            alert("فشل رفع بعض البيانات للسحاب، لكن تم تحديث النسخة المحلية.");
                            window.location.reload();
                        });
                    } else {
                        alert('تم استيراد البيانات بنجاح! سيتم إعادة تحميل الصفحة للتحديث.');
                        window.location.reload();
                    }
                }
            } else {
                alert('ملف النسخ الاحتياطي غير صالح أو تالف!');
            }
        } catch (err) {
            alert('فشل قراءة الملف. تأكد من أنه ملف JSON صالح!');
        }
    };
    reader.readAsText(file);
}

// مسح كامل لقاعدة البيانات
function resetAllData() {
    if (state.currentUser.role !== 'admin') return;
    
    if (confirm('⚠️ تحذير نهائي: هل أنت متأكد من مسح جميع البيانات الحالية وإعادة تعيين التطبيق للحالة الافتراضية؟ لا يمكن التراجع عن هذا الإجراء!')) {
        localStorage.removeItem('mn_transactions');
        localStorage.removeItem('mn_sellers');
        localStorage.removeItem('mn_users');
        localStorage.removeItem('mn_packages');
        localStorage.removeItem('mn_active_session');
        alert('تم مسح البيانات بنجاح. سيتم إعادة تهيئة التطبيق.');
        window.location.reload();
    }
}

// ==========================================================================
// 14. Progressive Web App (PWA) Setup
// ==========================================================================
let deferredPrompt;

function initPWAService() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('ServiceWorker registered successfully:', reg.scope))
                .catch(err => console.warn('ServiceWorker registration failed:', err));
        });
    }

    const banner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('pwa-install-btn');
    const closeBtn = document.getElementById('pwa-close-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        if (banner) {
            banner.style.display = 'flex';
            banner.style.animation = 'fadeUp 0.5s ease-out forwards';
        }
    });

    if (installBtn) {
        installBtn.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the PWA install prompt');
                    }
                    deferredPrompt = null;
                    if (banner) banner.style.display = 'none';
                });
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (banner) banner.style.display = 'none';
        });
    }
}

// ==========================================================================
// ☁️ دوال إعدادات الربط السحابي (Firebase Setup)
// ==========================================================================
function openFirebaseSetupModal() {
    // تعبئة البيانات الحالية إن وجدت
    const configStr = localStorage.getItem('mn_firebase_config');
    if (configStr) {
        try {
            const config = JSON.parse(configStr);
            document.getElementById('fb-apiKey').value = config.apiKey || '';
            document.getElementById('fb-authDomain').value = config.authDomain || '';
            document.getElementById('fb-projectId').value = config.projectId || '';
            document.getElementById('fb-storageBucket').value = config.storageBucket || '';
            document.getElementById('fb-messagingSenderId').value = config.messagingSenderId || '';
            document.getElementById('fb-appId').value = config.appId || '';
        } catch (e) {}
    }
    document.getElementById('firebase-setup-modal').style.display = 'flex';
}

function closeFirebaseSetupModal() {
    document.getElementById('firebase-setup-modal').style.display = 'none';
}

function saveFirebaseConfig(e) {
    e.preventDefault();
    
    const config = {
        apiKey: document.getElementById('fb-apiKey').value.trim(),
        authDomain: document.getElementById('fb-authDomain').value.trim(),
        projectId: document.getElementById('fb-projectId').value.trim(),
        storageBucket: document.getElementById('fb-storageBucket').value.trim(),
        messagingSenderId: document.getElementById('fb-messagingSenderId').value.trim(),
        appId: document.getElementById('fb-appId').value.trim()
    };
    
    localStorage.setItem('mn_firebase_config', JSON.stringify(config));
    alert('تم حفظ إعدادات الربط السحابي! سيتم إعادة تحميل الصفحة لتطبيق التغييرات.');
    window.location.reload();
}

function clearFirebaseConfig() {
    if (confirm('هل أنت متأكد من حذف إعدادات الربط السحابي والعودة للوضع المحلي؟ لن يتم حذف البيانات المحلية ولكن ستتوقف المزامنة السحابية.')) {
        localStorage.removeItem('mn_firebase_config');
        alert('تم حذف إعدادات السحاب والعودة للوضع المحلي. سيتم إعادة تحميل الصفحة.');
        window.location.reload();
    }
}
