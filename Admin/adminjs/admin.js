$(document).ready(function() {

    const logoutButton = document.getElementById('logout-link');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            const userIsSure = window.confirm("Are you sure you want to log out?");
            if (userIsSure) {
                window.location.href = this.href;
            }
        });
    }

    $('.sidebar-nav .nav-link').on('click', function(e) {
        e.preventDefault();
        var targetId = $(this).data('target');
        if (targetId) {
            $('.sidebar-nav .nav-link').removeClass('active');
            $(this).addClass('active');
            $('.content-section').removeClass('active');
            $('#' + targetId).addClass('active');
            var titleText = $(this).clone().find('i').remove().end().text().trim();
            $('#page-title').text(titleText);

            if (targetId === 'analytics-content') {
                initializeAnalyticsCharts();
            }
        }
    });

    var addGymModal = $('#add-gym-modal');
    var addGymBtnInSection = $('#gyms-content button.add-btn');
    var addGymForm = $('#add-gym-form');
    var gymTableBody = $('#gyms-content table tbody');

    function showAddGymModal() {
        addGymModal.show();
    }

    function hideAndResetGymModal() {
         addGymModal.hide();
         addGymForm[0].reset();
    }

    addGymBtnInSection.on('click', showAddGymModal);
    addGymModal.find('.close-btn').on('click', hideAndResetGymModal);

    addGymForm.on('submit', function(e) {
        e.preventDefault();
        var gymId = $('#gym-id').val().trim();
        var gymName = $('#gym-name').val().trim();
        var gymLocation = $('#gym-location').val().trim();
        var gymManager = $('#gym-manager').val().trim();
        var gymCapacity = $('#gym-capacity').val().trim();

        if (!gymId || !gymName || !gymLocation || !gymManager || !gymCapacity) {
            alert('Please fill out all gym fields.');
            return;
        }

        var newRowHtml = `
            <tr>
                <td data-label="ID">${gymId}</td>
                <td data-label="Name">${gymName}</td>
                <td data-label="Location">${gymLocation}</td>
                <td data-label="Manager">${gymManager}</td>
                <td data-label="Capacity">${gymCapacity}</td>
                <td data-label="Actions">
                    <button class="btn btn-sm btn-danger">Delete</button>
                </td>
            </tr>
        `;
        gymTableBody.append(newRowHtml);
        alert(`Gym "${gymName}" added successfully!`);
        hideAndResetGymModal();
    });

    var addUserModal = $('#add-user-modal');
    var addUserBtnInSection = $('#users-content button.add-btn');
    var addUserForm = $('#add-user-form');
    var userTableBody = $('#users-content table tbody');

    function showAddUserModal() {
        addUserModal.show();
    }

    function hideAndResetUserModal() {
        addUserModal.hide();
        addUserForm[0].reset();
    }

    addUserBtnInSection.on('click', showAddUserModal);
    addUserModal.find('.close-btn').on('click', hideAndResetUserModal);

    addUserForm.on('submit', function(e) {
        e.preventDefault();
        var userId = $('#member-id').val().trim();
        var userName = $('#member-name').val().trim();
        var userEmail = $('#email').val().trim();
        var membership = $('#membership').val().trim();
        var status = $('#status').val().trim();

        if (!userId || !userName || !userEmail || !membership || !status) {
            alert('Please fill out all member fields.');
            return;
        }

         var newRowHtml = `
            <tr>
                <td data-label="ID">${userId}</td>
                <td data-label="Name">${userName}</td>
                <td data-label="Email">${userEmail}</td>
                <td data-label="Membership">${membership}</td>
                <td data-label="Status">${status}</td>
                <td data-label="Actions">
                    <button class="btn btn-sm btn-danger">Delete</button>
                </td>
            </tr>
        `;
        userTableBody.append(newRowHtml);
        alert(`User "${userName}" added successfully!`);
        hideAndResetUserModal();
    });

    var addCoachModal = $('#add-coach-modal');
    var addCoachBtnInSection = $('#staff-content button.add-btn');
    var addCoachForm = $('#add-coach-form');
    var coachTableBody = $('#staff-content table tbody');

    function showAddCoachModal() {
        addCoachModal.show();
    }

    function hideAndResetCoachModal() {
        addCoachModal.hide();
        addCoachForm[0].reset();
    }

    addCoachBtnInSection.on('click', showAddCoachModal);
    addCoachModal.find('.close-btn').on('click', hideAndResetCoachModal);

    addCoachForm.on('submit', function(e) {
        e.preventDefault();
        var coachId = $('#coach-id').val().trim();
        var coachName = $('#coach-name').val().trim();
        var coachRole = $('#coach-role').val().trim();
        var coachEmail = $('#coach-email').val().trim();
        var coachBranch = $('#coach-branch').val().trim();

        if (!coachId || !coachName || !coachRole || !coachEmail || !coachBranch) {
            alert('Please fill out all coach/staff fields.');
            return;
        }

        var newRowHtml = `
            <tr>
                <td data-label="ID">${coachId}</td>
                <td data-label="Name">${coachName}</td>
                <td data-label="Role">${coachRole}</td>
                <td data-label="Email">${coachEmail}</td>
                <td data-label="Gym Branch">${coachBranch}</td>
                <td data-label="Actions">
                    <button class="btn btn-sm btn-danger">Delete</button>
                </td>
            </tr>
        `;
        coachTableBody.append(newRowHtml);
        alert(`Coach/Staff "${coachName}" added successfully!`);
        hideAndResetCoachModal();
    });

    $(window).on('click', function(event) {
        if ($(event.target).is(addGymModal)) {
            hideAndResetGymModal();
        }
        if ($(event.target).is(addUserModal)) {
            hideAndResetUserModal();
        }
        if ($(event.target).is(addCoachModal)) {
             hideAndResetCoachModal();
        }
    });

    $('.content-area').on('click', '.btn-danger', function() {
        if (confirm('Are you sure you want to delete this item?')) {
            $(this).closest('tr').remove();
            alert('Item deleted (Simulation)!');
        }
    });

     $('.content-area').on('click', '.btn-info', function() {
         alert('Refund Action (Simulation)');
     });

     $('.content-area').on('click', '.btn-success', function() {
         alert('Mark as Paid Action (Simulation)');
          $(this).closest('tr').find('td[data-label="Status"]').text('Completed'); 
           $(this).remove();
     });

    let trendsChartInstance, newUserChartInstance, newGymChartInstance;

    function initializeAnalyticsCharts() {
        // Destroy existing charts if they exist to prevent duplicates
        if (trendsChartInstance) trendsChartInstance.destroy();
        if (newUserChartInstance) newUserChartInstance.destroy();
        if (newGymChartInstance) newGymChartInstance.destroy();

        const goldColor = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim();
        const goldLightColor = getComputedStyle(document.documentElement).getPropertyValue('--gold-light').trim();
        const lightGrayColor = getComputedStyle(document.documentElement).getPropertyValue('--light-gray').trim();
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-light').trim();


        const commonChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: borderColor },
                    ticks: { color: textColor }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor }
                }
            },
            plugins: {
                legend: {
                    labels: { color: textColor }
                },
                tooltip: {
                     backgroundColor: 'rgba(0, 0, 0, 0.8)',
                     titleColor: goldColor,
                     bodyColor: textColor,
                     displayColors: false
                }
            }
        };

        // Membership Trends Chart (Line)
        const trendsCtx = document.getElementById('trendsChart').getContext('2d');
        trendsChartInstance = new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Active Members',
                    data: [650, 700, 800, 810, 850, 900, 980],
                    borderColor: '#bf9a33',
                    backgroundColor: '#febd14',
                    tension: 0.3,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                }]
            },
            options: commonChartOptions
        });

        // New User Registrations Chart (Bar)
        const newUserCtx = document.getElementById('newUserChart').getContext('2d');
        newUserChartInstance = new Chart(newUserCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'New Users',
                    data: [15, 20, 30, 25, 40, 35, 50],
                    backgroundColor: '#fece43',
                    borderColor: '#bf9a33',
                    borderWidth: 2
                }]
            },
            options: commonChartOptions
        });

        // New Gym Locations Chart (Doughnut - example)
        const newGymCtx = document.getElementById('newGymChart').getContext('2d');
        newGymChartInstance = new Chart(newGymCtx, {
            type: 'doughnut',
            data: {
                labels: ['Downtown', 'Uptown', 'Westside', 'Eastside'],
                datasets: [{
                    label: 'Gyms by Region',
                    data: [5, 4, 6, 3],
                    backgroundColor: [
                        '#bf9a33',
                        '#febd14',
                        '#fece43',
                        '#feda75' 
                    ],
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--dark-gray').trim(),
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
             options: { 
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: textColor }
                    },
                    tooltip: {
                         backgroundColor: 'rgba(0, 0, 0, 0.8)',
                         titleColor: goldColor,
                         bodyColor: textColor,
                         displayColors: true
                    }
                }
            }
        });
    }

    if ($('#analytics-content').hasClass('active')) {
        initializeAnalyticsCharts();
    }

    $('table').each(function() {
        var $table = $(this);
        var $headerCells = $table.find('thead th');
        $table.find('tbody tr').each(function() {
            $(this).find('td').each(function(index) {
                $(this).attr('data-label', $headerCells.eq(index).text());
            });
        });
    });

}); 