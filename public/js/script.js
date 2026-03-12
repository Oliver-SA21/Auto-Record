// ===== FUNCIONALIDAD PARA LA PÁGINA DEL CHECADOR =====

// Botón "Registrar asistencia" o "Guardar Registro"
document.addEventListener('DOMContentLoaded', function () {
    const registerBtn = document.querySelector('.btn-primary');
    if (registerBtn) {
        registerBtn.addEventListener('click', function () {
            // Obtener valores del formulario
            const chofer = document.querySelector('select')?.value;
            const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
            const hora = document.querySelector('input[placeholder*="HH:MM"]')?.value;

            // Validación simple
            if (!chofer || chofer === " Selecciona " || chofer === "Seleccionar") {
                alert("⚠️ Por favor, selecciona un chofer.");
                return;
            }

            if (!tipo && document.querySelector('input[name="tipo"]')) {
                alert("⚠️ Por favor, selecciona si es Entrada o Salida.");
                return;
            }

            // Mensaje de éxito
            const tipoTexto = tipo === "entrada" ? "Entrada" : "Salida";
            alert(`✅ Registro exitoso!\nChofer: ${chofer}\nTipo: ${tipoTexto}\nHora: ${hora || "Actual"}`);
        });
    }

    // Botón "Generar Reporte" (en el lado derecho del checador)
    const reportBtn = document.querySelector('.right-column .btn-secondary');
    if (reportBtn) {
        reportBtn.addEventListener('click', function () {
            const confirmed = confirm("¿Deseas generar el reporte diario?");
            if (confirmed) {
                alert("📄 Reporte generado exitosamente.\nSe ha guardado en el sistema.");
            }
        });
    }

    // Botón "Guardar Registro" en la página del Chofer (Incidencias)
    const incidentBtn = document.querySelector('.incident-form .btn-primary');
    if (incidentBtn) {
        incidentBtn.addEventListener('click', function () {
            const tipo = document.querySelector('.incident-form select')?.value;
            const desc = document.querySelector('.incident-form textarea')?.value;

            if (!tipo || tipo === "Seleccionar tipo de incidencia") {
                alert("⚠️ Selecciona un tipo de incidencia.");
                return;
            }
            if (!desc || desc.trim() === "") {
                alert("⚠️ Por favor, describe la incidencia.");
                return;
            }

            alert("✅ ¡Incidencia reportada con éxito!\nEl equipo administrativo será notificado.");
        });
    }

    // Botón "Cerrar sesión" (en cualquier página)
    const logoutLinks = document.querySelectorAll('a[href="index.html"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault(); // Evita ir directo a inicio.html
            const confirmed = confirm("¿Estás seguro de que deseas cerrar sesión?");
            if (confirmed) {
                alert("👋 ¡Hasta pronto!");
                window.location.href = "index.html"; // Ahora sí redirige
            }
        });
    });
});