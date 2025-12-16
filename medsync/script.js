let currentUser = null;
let prescriptions = [];
let reminders = [];

function login() {
    const userType = document.getElementById('userType').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simulating login (in a real app, this would involve server-side authentication)
    if (username && password) {
        currentUser = { type: userType, name: username };
        document.getElementById('login').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('prescriptions').style.display = 'block';
        document.getElementById('reminders').style.display = 'block';
        updateDashboard();
    } else {
        alert('Please enter both username and password');
    }
}

function updateDashboard() {
    const notifications = document.getElementById('notifications');
    const interactions = document.getElementById('interactions');

    notifications.innerHTML = `<p>Welcome, ${currentUser.name}!</p>`;
    interactions.innerHTML = `<p>You have ${prescriptions.length} prescriptions and ${reminders.length} reminders.</p>`;

    if (currentUser.type === 'doctor') {
        document.getElementById('prescriptionForm').style.display = 'block';
    }

    updatePrescriptionList();
    updateReminderList();
}

function addPrescription() {
    const medicationName = document.getElementById('medicationName').value;
    const dosage = document.getElementById('dosage').value;
    const frequency = document.getElementById('frequency').value;

    if (medicationName && dosage && frequency) {
        prescriptions.push({ medicationName, dosage, frequency });
        updatePrescriptionList();
        document.getElementById('medicationName').value = '';
        document.getElementById('dosage').value = '';
        document.getElementById('frequency').value = '';
    } else {
        alert('Please fill in all prescription details');
    }
}

function updatePrescriptionList() {
    const prescriptionList = document.getElementById('prescriptionList');
    prescriptionList.innerHTML = '';
    prescriptions.forEach((prescription, index) => {
        const li = document.createElement('li');
        li.textContent = `${prescription.medicationName} - ${prescription.dosage} - ${prescription.frequency}`;
        if (currentUser.type === 'pharmacy') {
            const refillButton = document.createElement('button');
            refillButton.textContent = 'Refill';
            refillButton.onclick = () => refillPrescription(index);
            li.appendChild(refillButton);
        }
        prescriptionList.appendChild(li);
    });
}

function refillPrescription(index) {
    alert(`Prescription for ${prescriptions[index].medicationName} has been refilled.`);
    // In a real app, this would update the prescription status and notify the patient
}

function addReminder() {
    const reminderText = document.getElementById('reminderText').value;
    const reminderDateTime = document.getElementById('reminderDateTime').value;

    if (reminderText && reminderDateTime) {
        reminders.push({ text: reminderText, dateTime: reminderDateTime });
        updateReminderList();
        document.getElementById('reminderText').value = '';
        document.getElementById('reminderDateTime').value = '';
    } else {
        alert('Please fill in both reminder text and date/time');
    }
}

function updateReminderList() {
    const reminderList = document.getElementById('reminderList');
    reminderList.innerHTML = '';
    reminders.forEach(reminder => {
        const li = document.createElement('li');
        li.textContent = `${reminder.text} - ${reminder.dateTime}`;
        reminderList.appendChild(li);
    });
}

// Simulating real-time updates
setInterval(() => {
    if (currentUser) {
        // In a real app, this would check for new data from the server
        if (Math.random() > 0.8) {
            const notification = document.createElement('p');
            notification.textContent = 'New update available!';
            document.getElementById('notifications').appendChild(notification);
        }
    }
}, 5000);

console.log("MediSync app initialized. Open index.html in a web browser to view the app.");

