import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import { 
    getDatabase,
    ref,
    onValue,
    set,
    push
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


// ===============================
// CONFIGURATION FIREBASE
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyAb59EsP80dHMWf0ZbK77-Kr5dD0_f0swA",
  authDomain: "cocon-6c80b.firebaseapp.com",
  databaseURL: "https://cocon-6c80b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cocon-6c80b",
  storageBucket: "cocon-6c80b.firebasestorage.app",
  messagingSenderId: "277584773276",
  appId: "1:277584773276:web:4b75a2166c416df6d3ad59"
};


const app = initializeApp(firebaseConfig);

const db = getDatabase(app);
const successModal = document.getElementById("success-modal");
const closeModal = document.getElementById("close-modal");



// ===============================
// VARIABLES
// ===============================

let pricePerNight = 150;

let disabledDates = [];

let selectedStartDate = null;

let selectedEndDate = null;

let totalPrice = 0;

let calendar;



// ===============================
// ELEMENTS HTML
// ===============================


const priceDisplay =
document.getElementById("live-price");


const btn =
document.getElementById("btn-action");


const priceBox =
document.getElementById("price-breakdown");


const status =
document.getElementById("status-notice");



// ===============================
// FORMAT DATE LOCAL
// ===============================

function formatDate(date){

    let y=date.getFullYear();

    let m=String(date.getMonth()+1)
    .padStart(2,"0");

    let d=String(date.getDate())
    .padStart(2,"0");


    return `${y}-${m}-${d}`;

}



// ===============================
// CHARGER LE PRIX ADMIN
// ===============================

onValue(
ref(db,"config/nightlyPrice"),

(snapshot)=>{

    if(snapshot.exists()){

        pricePerNight =
        Number(snapshot.val());

    }


    priceDisplay.textContent =
    pricePerNight;

    calculatePrice();

});





// ===============================
// CHARGER RESERVATIONS
// ===============================


onValue(
ref(db,"bookings"),

(snapshot)=>{


    disabledDates=[];


    if(snapshot.exists()){


        let bookings =
        snapshot.val();



        Object.values(bookings)
        .forEach(b=>{


            if(
    b.status==="confirmee" ||
    b.status==="en_attente" ||
    b.status==="ferme"
){


                let start =
                new Date(
                b.startDate+"T00:00:00"
                );


                let end =
                new Date(
                b.endDate+"T00:00:00"
                );



                while(start<=end){


                    disabledDates.push(
                    formatDate(start)
                    );


                    start.setDate(
                    start.getDate()+1
                    );

                }

            }


        });


    }



    createCalendar();

});





// ===============================
// CREATION CALENDRIER
// ===============================


function createCalendar(){


if(calendar){

    calendar.destroy();

}



calendar =
flatpickr(
"#booking-dates",

{

    locale:"fr",

    mode:"range",

    minDate:"today",

    dateFormat:"Y-m-d",



    disable:[

        function(date){


            return disabledDates.includes(
            formatDate(date)
            );


        }

    ],



    onDayCreate:
    function(dObj,dStr,fp,dayElem){


        let date =
        formatDate(dayElem.dateObj);



        if(disabledDates.includes(date)){


            dayElem.classList
            .add("busy-day");


        }
        else{


            dayElem.classList
            .add("free-day");


        }


    },



    onChange:function(selected){



        if(selected.length===2){


            selectedStartDate =
            formatDate(selected[0]);


            selectedEndDate =
            formatDate(selected[1]);



            calculatePrice();



            btn.disabled=false;

            btn.textContent=
            "Réserver maintenant";


        }


    }



});


}





// ===============================
// CALCUL PRIX
// ===============================


function calculatePrice(){



if(
!selectedStartDate ||
!selectedEndDate
){

return;

}



let start =
new Date(selectedStartDate);


let end =
new Date(selectedEndDate);



let nights =
Math.ceil(
(end-start)/(1000*60*60*24)
);



if(nights>0){



totalPrice =
nights * pricePerNight;



document.getElementById(
"breakdown-label"
)
.textContent =
`${nights} nuit(s) x ${pricePerNight}€`;



document.getElementById(
"breakdown-amount"
)
.textContent =
`${totalPrice} €`;



document.getElementById(
"total-amount"
)
.textContent =
`${totalPrice} €`;



priceBox.classList.remove(
"hidden"
);



}



}




// ===============================
// ENVOYER RESERVATION
// ===============================


btn.addEventListener(
"click",
(e)=>{

e.preventDefault();
            
            
            // Vérification des dates
            
            if (!selectedStartDate || !selectedEndDate) {
                
                alert(
                    "Veuillez sélectionner vos dates de séjour."
                );
                
                return;
                
            }
            
            
            
            // Récupération des informations client
            
            let name =
                document.getElementById(
                    "guest-name"
                ).value.trim();
            
            
            let phone =
                document.getElementById(
                    "guest-phone"
                ).value.trim();
            
            
            
            let arrival =
                document.getElementById(
                    "guest-arrival"
                ).value;
            
            
            
            let email =
                document.getElementById(
                    "guest-email"
                ).value.trim();
            
            
            
            
            
            // Vérification des champs obligatoires
            
            if (!name || !phone) {
                
                alert(
                    "Nom et téléphone obligatoires."
                );
                
                return;
                
            }


let booking={


guestName:name,

guestPhone:phone,

guestEmail:
email || "Non renseigné",

guestArrival:arrival,


startDate:selectedStartDate,

endDate:selectedEndDate,


totalPrice:totalPrice,


status:"en_attente",


timestamp:
Date.now()


};




let bookingRef =
push(
ref(db,"bookings")
);



set(
bookingRef,
booking
)

.then(()=>{


btn.disabled=true;

btn.textContent=
"⏳ Réservation envoyée";


// Afficher popup professionnelle
if(successModal){

    successModal.classList.remove("hidden");

}


// Message secondaire
if(status){

    status.textContent =
    "Votre demande est enregistrée. Nous allons vous contacter.";

    status.className =
    "status-notice success";

    status.classList.remove("hidden");

}



listenStatus(
bookingRef.key
);



});

});


if(closeModal){

    closeModal.addEventListener("click",()=>{

        successModal.classList.add("hidden");

    });

}

// ===============================
// ECOUTE STATUT ADMIN
// ===============================


function listenStatus(id){



onValue(
ref(db,`bookings/${id}/status`),

(snapshot)=>{


let s=snapshot.val();



if(s==="confirmee"){


btn.textContent=
"✓ Séjour confirmé";


}



if(s==="annulee"){


btn.disabled=false;


btn.textContent=
"Choisir d'autres dates";


}



});


}
