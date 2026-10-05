import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";


import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";



/* =========================
   FIREBASE CONFIG
========================= */


const firebaseConfig = {

    apiKey:
        "AIzaSyCXDBm3WiI37D9gUEvt1crSAKbSOXwHWRk",

    authDomain:
        "my-ot-calendar.firebaseapp.com",

    projectId:
        "my-ot-calendar",

    storageBucket:
        "my-ot-calendar.firebasestorage.app",

    messagingSenderId:
        "631206414956",

    appId:
        "1:631206414956:web:1bf04374ec378190c56649",

    measurementId:
        "G-1K8V7K24GR"

};



const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getFirestore(app);



/* =========================
   VARIABLES
========================= */


let currentDate =
    new Date();


let selectedDate =
    "";


let otData =
    {};


let currentUser =
    null;



/* =========================
   LOGIN
========================= */


async function login() {

    const email =
        document.getElementById(
            "loginEmail"
        ).value.trim();


    const password =
        document.getElementById(
            "loginPassword"
        ).value;


    if (!email || !password) {

        showLoginError(
            "กรุณากรอก Email และ Password"
        );

        return;

    }


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    } catch (error) {

        console.error(error);

        showLoginError(
            getFirebaseError(error)
        );

    }

}



/* =========================
   REGISTER
========================= */


async function register() {

    const email =
        document.getElementById(
            "registerEmail"
        ).value.trim();


    const password =
        document.getElementById(
            "registerPassword"
        ).value;


    const confirmPassword =
        document.getElementById(
            "registerPasswordConfirm"
        ).value;



    if (!email || !password) {

        showRegisterError(
            "กรุณากรอกข้อมูลให้ครบ"
        );

        return;

    }


    if (password.length < 6) {

        showRegisterError(
            "Password ต้องมีอย่างน้อย 6 ตัวอักษร"
        );

        return;

    }


    if (password !== confirmPassword) {

        showRegisterError(
            "Password ไม่ตรงกัน"
        );

        return;

    }



    try {

        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );


        alert(
            "สมัครสมาชิกเรียบร้อยแล้ว"
        );


    } catch (error) {

        console.error(error);

        showRegisterError(
            getFirebaseError(error)
        );

    }

}



/* =========================
   LOGOUT
========================= */


async function logout() {

    await signOut(auth);

}



/* =========================
   AUTH STATE
========================= */


onAuthStateChanged(
    auth,
    async (user) => {

        if (user) {

            currentUser =
                user;


            document.getElementById(
                "loginPage"
            ).style.display = "none";


            document.getElementById(
                "registerPage"
            ).style.display = "none";


            document.getElementById(
                "appPage"
            ).style.display = "block";


            document.getElementById(
                "userEmail"
            ).textContent =
                user.email;


            await loadOT();


            renderCalendar();

        } else {

            currentUser =
                null;


            document.getElementById(
                "loginPage"
            ).style.display = "flex";


            document.getElementById(
                "registerPage"
            ).style.display = "none";


            document.getElementById(
                "appPage"
            ).style.display = "none";

        }

    }
);



/* =========================
   LOAD OT
========================= */


async function loadOT() {

    if (!currentUser)
        return;


    otData = {};


    const otCollection =
        collection(
            db,
            "users",
            currentUser.uid,
            "overtime"
        );


    const snapshot =
        await getDocs(
            otCollection
        );


    snapshot.forEach(
        (document) => {

            otData[
                document.id
            ] =
                document.data();

        }
    );

}



/* =========================
   SAVE OT
========================= */


async function saveOT() {

    const hours =
        parseFloat(
            document.getElementById(
                "otHours"
            ).value
        );


    const note =
        document.getElementById(
            "otNote"
        ).value.trim();


    if (
        isNaN(hours) ||
        hours <= 0
    ) {

        alert(
            "กรุณาใส่จำนวนชั่วโมง OT"
        );

        return;

    }


    if (!currentUser) {

        alert(
            "กรุณา Login ก่อน"
        );

        return;

    }



    try {

        const otDocument =
            doc(
                db,
                "users",
                currentUser.uid,
                "overtime",
                selectedDate
            );


        await setDoc(
            otDocument,
            {

                date:
                    selectedDate,

                hours:
                    hours,

                note:
                    note,

                updatedAt:
                    new Date().toISOString()

            }
        );


        otData[
            selectedDate
        ] = {

            date:
                selectedDate,

            hours:
                hours,

            note:
                note

        };


        renderCalendar();


        const modal =
            bootstrap.Modal.getInstance(
                document.getElementById(
                    "otModal"
                )
            );


        modal.hide();


    } catch (error) {

        console.error(error);

        alert(
            "บันทึก OT ไม่สำเร็จ"
        );

    }

}



/* =========================
   DELETE OT
========================= */


async function deleteCurrentOT() {

    if (!selectedDate)
        return;


    if (!otData[selectedDate]) {

        alert(
            "วันนี้ยังไม่มีข้อมูล OT"
        );

        return;

    }


    const confirmDelete =
        confirm(
            "ต้องการลบ OT วันนี้หรือไม่?"
        );


    if (!confirmDelete)
        return;



    try {

        await deleteDoc(
            doc(
                db,
                "users",
                currentUser.uid,
                "overtime",
                selectedDate
            )
        );


        delete otData[
            selectedDate
        ];


        renderCalendar();


        const modal =
            bootstrap.Modal.getInstance(
                document.getElementById(
                    "otModal"
                )
            );


        modal.hide();


    } catch (error) {

        console.error(error);

        alert(
            "ลบ OT ไม่สำเร็จ"
        );

    }

}



/* =========================
   CALENDAR
========================= */


function renderCalendar() {

    const calendar =
        document.getElementById(
            "calendar"
        );


    calendar.innerHTML = "";


    const year =
        currentDate.getFullYear();


    const month =
        currentDate.getMonth();


    const monthNames = [

        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม"

    ];


    document.getElementById(
        "monthYear"
    ).textContent =

        monthNames[month] +
        " " +
        (year + 543);



    let startDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    startDay =
        startDay === 0
            ? 6
            : startDay - 1;



    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();



    for (
        let i = 0;
        i < startDay;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "day";


        empty.style.visibility =
            "hidden";


        calendar.appendChild(
            empty
        );

    }



    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "day";



        const dateKey =

            `${year}-${String(
                month + 1
            ).padStart(2, "0")}-${String(
                day
            ).padStart(2, "0")}`;



        const number =
            document.createElement(
                "div"
            );


        number.className =
            "day-number";


        number.textContent =
            day;


        div.appendChild(
            number
        );



        const today =
            new Date();


        if (

            day ===
            today.getDate() &&

            month ===
            today.getMonth() &&

            year ===
            today.getFullYear()

        ) {

            div.classList.add(
                "today"
            );

        }



        if (
            otData[dateKey]
        ) {

            const ot =
                document.createElement(
                    "div"
                );


            ot.className =
                "ot";


            ot.textContent =
                "OT " +
                otData[
                    dateKey
                ].hours +
                " ชม.";


            div.appendChild(
                ot
            );

        }



        div.onclick =
            function () {

                openOTModal(
                    dateKey
                );

            };



        calendar.appendChild(
            div
        );

    }



    updateSummary();

}



/* =========================
   OPEN OT
========================= */


function openOTModal(
    dateKey
) {

    selectedDate =
        dateKey;


    const date =
        new Date(
            dateKey +
            "T00:00:00"
        );


    const day =
        date.getDate();


    const month =
        date.getMonth() + 1;


    const year =
        date.getFullYear() + 543;


    document.getElementById(
        "selectedDate"
    ).textContent =

        `${day}/${month}/${year}`;



    document.getElementById(
        "otHours"
    ).value =

        otData[dateKey]?.hours ||
        "";


    document.getElementById(
        "otNote"
    ).value =

        otData[dateKey]?.note ||
        "";



    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "otModal"
            )
        );


    modal.show();

}



/* =========================
   SUMMARY
========================= */


function updateSummary() {

    const year =
        currentDate.getFullYear();


    const month =
        currentDate.getMonth();


    let total = 0;

    let days = 0;



    for (
        const date in otData
    ) {

        const d =
            new Date(
                date +
                "T00:00:00"
            );


        if (

            d.getFullYear() ===
            year &&

            d.getMonth() ===
            month

        ) {

            total +=
                Number(
                    otData[
                        date
                    ].hours
                );


            days++;

        }

    }



    document.getElementById(
        "totalOT"
    ).textContent =

        total +
        " ชั่วโมง";


    document.getElementById(
        "otDays"
    ).textContent =

        days +
        " วัน";

}



/* =========================
   MONTH
========================= */


function previousMonth() {

    currentDate.setMonth(
        currentDate.getMonth() - 1
    );


    renderCalendar();

}


function nextMonth() {

    currentDate.setMonth(
        currentDate.getMonth() + 1
    );


    renderCalendar();

}



/* =========================
   LOGIN / REGISTER PAGE
========================= */


function showRegister() {

    document.getElementById(
        "loginPage"
    ).style.display = "none";


    document.getElementById(
        "registerPage"
    ).style.display = "flex";

}


function showLogin() {

    document.getElementById(
        "registerPage"
    ).style.display = "none";


    document.getElementById(
        "loginPage"
    ).style.display = "flex";

}



/* =========================
   ERROR
========================= */


function showLoginError(
    message
) {

    const box =
        document.getElementById(
            "loginError"
        );


    box.textContent =
        message;


    box.style.display =
        "block";

}


function showRegisterError(
    message
) {

    const box =
        document.getElementById(
            "registerError"
        );


    box.textContent =
        message;


    box.style.display =
        "block";

}



/* =========================
   FIREBASE ERROR
========================= */


function getFirebaseError(
    error
) {

    switch (
        error.code
    ) {

        case
        "auth/invalid-credential":

            return "Email หรือ Password ไม่ถูกต้อง";


        case
        "auth/user-not-found":

            return "ไม่พบผู้ใช้นี้";


        case
        "auth/wrong-password":

            return "Password ไม่ถูกต้อง";


        case
        "auth/email-already-in-use":

            return "Email นี้ถูกใช้งานแล้ว";


        case
        "auth/invalid-email":

            return "รูปแบบ Email ไม่ถูกต้อง";


        case
        "auth/weak-password":

            return "Password ต้องมีอย่างน้อย 6 ตัวอักษร";


        default:

            return error.message;

    }

}



/* =========================
   GLOBAL FUNCTIONS
========================= */


window.login =
    login;


window.register =
    register;


window.logout =
    logout;


window.showRegister =
    showRegister;


window.showLogin =
    showLogin;


window.saveOT =
    saveOT;


window.deleteCurrentOT =
    deleteCurrentOT;


window.previousMonth =
    previousMonth;


window.nextMonth =
    nextMonth;
