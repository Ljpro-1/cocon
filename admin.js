// ===============================
// FIREBASE IMPORT
// ===============================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";


import {
    getDatabase,
    ref,
    onValue,
    set,
    update,
    push,
    remove
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




// ===============================
// VARIABLES
// ===============================

let manualCalendarInstance = null;

let selectedManualStart = null;

let selectedManualEnd = null;
let occupiedDates = [];




// ===============================
// ELEMENTS DOM
// ===============================

const authOverlay =
document.getElementById("auth-overlay");


const dashboard =
document.getElementById("admin-dashboard");


const loginBtn =
document.getElementById("btn-login");


const logoutBtn =
document.getElementById("btn-logout");


const errorBox =
document.getElementById("auth-error");



// ===============================
// VERIFICATION SESSION
// ===============================

if(
sessionStorage.getItem("admin_authenticated")
==="true"
){

    authOverlay.classList.add("hidden");

    dashboard.classList.remove("hidden");

}



// ===============================
// CONNEXION ADMIN
// ===============================


loginBtn.addEventListener(
"click",
()=>{


const code =
document.getElementById("admin-pass")
.value.trim();



if(code==="COCON2026"){


sessionStorage.setItem(
"admin_authenticated",
"true"
);


authOverlay.classList.add(
"hidden"
);


dashboard.classList.remove(
"hidden"
);



}

else{


errorBox.classList.remove(
"hidden"
);


setTimeout(()=>{

errorBox.classList.add(
"hidden"
);

},3000);



}


});





// ===============================
// DECONNEXION
// ===============================

logoutBtn.addEventListener(
"click",
()=>{


sessionStorage.removeItem(
"admin_authenticated"
);


location.reload();


});






// ===============================
// FORMAT DATE
// ===============================

function formatDateLocal(date){


let y =
date.getFullYear();


let m =
String(date.getMonth()+1)
.padStart(2,"0");


let d =
String(date.getDate())
.padStart(2,"0");



return `${y}-${m}-${d}`;

}





// ===============================
// AFFICHAGE RESERVATIONS
// ===============================


onValue(
ref(db,"bookings"),

(snapshot)=>{


const container =
document.getElementById(
"bookings-container"
);



container.innerHTML="";



if(!snapshot.exists()){


container.innerHTML=
`
<p class="no-data">
Aucune réservation enregistrée.
</p>
`;

return;


}




let data =
snapshot.val();

occupiedDates = [];


Object.values(snapshot.val()).forEach((booking) => {
    
    
    if (
        booking.status === "confirmee" ||
        booking.status === "en_attente"
    ) {
        
        
        let start =
            new Date(
                booking.startDate + "T00:00:00"
            );
        
        
        let end =
            new Date(
                booking.endDate + "T00:00:00"
            );
        
        
        
        while (start <= end) {
            
            
            occupiedDates.push(
                formatDateLocal(start)
            );
            
            
            start.setDate(
                start.getDate() + 1
            );
            
            
        }
        
        
        
    }
    
    
});

let list =
Object.entries(data)
.map(([id,value])=>({

id,
...value

}));



list.sort(
(a,b)=>
b.timestamp-a.timestamp
);



list.forEach(
(booking)=>{


let card =
document.createElement("div");


card.className =
"booking-card";



let statusText =
"En attente";


if(booking.status==="confirmee")
statusText="Confirmé";


if(booking.status==="annulee")
statusText="Annulé";


if(booking.status==="ferme")
statusText="Fermeture";




let nights =
Math.ceil(

(
new Date(booking.endDate)
-
new Date(booking.startDate)

)
/
(1000*60*60*24)

);




card.innerHTML =
`

<span class="badge ${booking.status}">
${statusText}
</span>


<h4>
${booking.guestName || "Blocage administratif"}
</h4>


<p>
📅 ${booking.startDate}
→
${booking.endDate}
(${nights} nuit(s))
</p>



<p>
📞 ${booking.guestPhone || "-"}
</p>



<p>
🕒 Arrivée :
${booking.guestArrival || "-"}
</p>



<p>
💶 Prix :
${booking.totalPrice || "-"} €
</p>



<div class="b-actions">

${
booking.status==="en_attente"

?

`

<button 
class="btn-action-ok"
data-id="${booking.id}">
Confirmer
</button>


<button 
class="btn-action-cancel"
data-id="${booking.id}">
Refuser
</button>

`

:

`

<button
class="btn-action-delete"
data-id="${booking.id}">
Supprimer
</button>

`

}


</div>

`;



container.appendChild(card);



});



bindButtons();



});





function bindButtons(){


document
.querySelectorAll(".btn-action-ok")
.forEach(btn=>{


btn.onclick=()=>{


update(
ref(
db,
`bookings/${btn.dataset.id}`
),

{
status:"confirmee"
}

);


};


});



document
.querySelectorAll(".btn-action-cancel")
.forEach(btn=>{


btn.onclick=()=>{


update(
ref(
db,
`bookings/${btn.dataset.id}`
),

{
status:"annulee"
}

);


};


});



document
.querySelectorAll(".btn-action-delete")
.forEach(btn=>{


btn.onclick=()=>{


remove(
ref(
db,
`bookings/${btn.dataset.id}`
)
);


};


});


}
// ===============================
// GESTION DU PRIX PAR NUIT
// ===============================


const priceInput =
document.getElementById(
"nightly-price-input"
);


const updatePriceBtn =
document.getElementById(
"btn-update-price"
);



// Charger le prix actuel

onValue(
ref(db,"config/nightlyPrice"),

(snapshot)=>{


if(snapshot.exists()){


priceInput.value =
snapshot.val();


}


});





// Modifier le prix

updatePriceBtn.addEventListener(
"click",

()=>{


let newPrice =
Number(
priceInput.value
);



if(newPrice <= 0){

alert(
"Veuillez entrer un prix valide."
);

return;

}



set(
ref(db,"config/nightlyPrice"),
newPrice

)

.then(()=>{


alert(
"✓ Tarif mis à jour avec succès."
);


});


});
// ===============================
// PROTECTION DASHBOARD
// ===============================


function checkAdminAccess(){


const connected =
sessionStorage.getItem(
"admin_authenticated"
);



if(
connected !== "true"
){


dashboard.classList.add(
"hidden"
);


authOverlay.classList.remove(
"hidden"
);


}



}

// ===============================
// CALENDRIER BLOCAGE MANUEL
// ===============================


if(document.getElementById("manual-dates")){


manualCalendarInstance = flatpickr(
"#manual-dates",
{

    locale:"fr",

    mode:"range",

    minDate:"today",

    dateFormat:"Y-m-d",

    showMonths:2,


    onChange:function(selectedDates){


        if(selectedDates.length === 2){


            selectedManualStart =
            formatDateLocal(
                selectedDates[0]
            );


            selectedManualEnd =
            formatDateLocal(
                selectedDates[1]
            );


        }


    }


});


}




// ===============================
// BOUTON BLOQUER LES DATES
// ===============================


const manualButton =
document.getElementById(
"btn-submit-manual"
);



if(manualButton){


manualButton.addEventListener(
"click",
()=>{


// Vérifier si une période est sélectionnée

if(
!selectedManualStart ||
!selectedManualEnd
){

alert(
"Veuillez sélectionner une période."
);

return;

}



// ===============================
// VERIFICATION CONFLIT RESERVATION
// ===============================


let start =
new Date(
selectedManualStart+"T00:00:00"
);


let end =
new Date(
selectedManualEnd+"T00:00:00"
);


let conflict = false;



while(start <= end){


let day =
formatDateLocal(start);



if(
occupiedDates.includes(day)
){

conflict = true;

break;

}



start.setDate(
start.getDate()+1
);


}




if(conflict){


alert(
"⚠️ Impossible de bloquer cette période : une réservation existe déjà."
);


return;


}




// ===============================
// SI AUCUN CONFLIT → ENREGISTRER
// ===============================


let fermeture = {

guestName:
"Fermeture administrative",

startDate:
selectedManualStart,

endDate:
selectedManualEnd,

status:
"ferme",

timestamp:
Date.now()

};



push(
ref(db,"bookings"),
fermeture

)

.then(()=>{


alert(
"✓ Les dates ont été bloquées."
);


manualCalendarInstance.clear();


selectedManualStart=null;

selectedManualEnd=null;


});


});


}

checkAdminAccess();
