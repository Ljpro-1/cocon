// Attendre que le document HTML soit complètement chargé
document.addEventListener("DOMContentLoaded", () => {
    
    // Sélectionner le bouton de réservation
    const reserveBtn = document.getElementById("btn-reserve");

    if (reserveBtn) {
        // Ajouter l'événement de clic pour rediriger vers la page client
        reserveBtn.addEventListener("click", () => {
            window.location.href = "client.html";
        });
    }

    // Effet d'apparition fluide des cartes (Animation Bonus pour le Portfolio)
    const roomCards = document.querySelectorAll(".room-card");
    roomCards.forEach((card, index) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        
        setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
        }, index * 200); // Décale l'apparition de chaque carte
    });
});
