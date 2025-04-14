function openModal(event, modalId) {
  event.preventDefault();

  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.style.display = "block";
  modal.setAttribute("tabindex", "-1");
  modal.focus();

  // Store the trigger element to restore focus later
  modal.dataset.trigger = event.currentTarget;
  modal.dataset.modalId = modalId;
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.style.display = "none";

  // Restore focus to the element that triggered the modal
  const trigger = modal.dataset.trigger;
  if (trigger && typeof trigger.focus === "function") {
    trigger.focus();
  }
}

// Escape key closes any open modal
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    document.querySelectorAll(".iframe-modal").forEach(modal => {
      if (modal.style.display === "block") {
        closeModal(modal.id);
      }
    });
  }
});

// Clicking outside modal content closes it
window.addEventListener("click", function (event) {
  const modals = document.querySelectorAll(".iframe-modal");
  modals.forEach(modal => {
    if (event.target === modal) {
      closeModal(modal.id);
    }
  });
});
