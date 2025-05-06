$(document).ready(function() {
    // --- Header Menu Toggle ---
    var menuIcon = $('#menu-icon');
    var navbar = $('.navbar');
    var logoutLink = $('#logout-link');
    var logoutModal = $('#logoutConfirmationModal');
    var closeLogoutModalBtn = $('#closeLogoutModalButton');
    var cancelLogoutBtn = $('#cancelLogoutButton');
    var okLogoutBtn = $('#okLogoutButton');

    if (menuIcon.length && navbar.length) {
        menuIcon.on('click', function() {
            $(this).toggleClass('bx-x');
            navbar.toggleClass('active');
        });

        // Close menu when a link is clicked (except logout)
        $('.navbar a').on('click', function(event) {
             if (navbar.hasClass('active') && !$(this).is('#logout-link')) {
                 navbar.removeClass('active');
                 menuIcon.removeClass('bx-x');
             }
        });

        // Close menu if profile pic area is clicked while menu open
        $('.navbar-right li:has(.profile-pic)').on('click', function(e) {
             if(navbar.hasClass('active')) {
                  navbar.removeClass('active');
                  menuIcon.removeClass('bx-x');
             }
        });

        // Close menu on scroll
        $(window).on('scroll', function() {
            if (navbar.hasClass('active')) {
                navbar.removeClass('active');
                menuIcon.removeClass('bx-x');
            }
        });
    } else {
        console.warn("Header menu icon or navbar not found.");
    }

    // --- Logout Modal Logic ---
    if (logoutLink.length && logoutModal.length) {
        logoutLink.on('click', function(event) {
            event.preventDefault(); // Prevent default link navigation
            logoutModal.addClass('show'); // Show the modal
        });

        closeLogoutModalBtn.on('click', function() {
            logoutModal.removeClass('show'); // Hide modal
        });

        cancelLogoutBtn.on('click', function() {
            logoutModal.removeClass('show'); // Hide modal
        });

        okLogoutBtn.on('click', function() {
            logoutModal.removeClass('show'); // Hide modal
            // Redirect to the original logout link's href
            window.location.href = logoutLink.attr('href');
        });

        // Close modal if clicked outside the content
        $(window).on('click', function(event) {
            if ($(event.target).is(logoutModal)) {
                logoutModal.removeClass('show');
            }
        });
    } else {
         console.warn("Logout link or modal not found.");
         // Fallback for original non-modal behavior if needed
         $('#logout-link').on('click', function(event) {
              event.preventDefault();
              var confirmLogout = confirm("Are you sure you want to logout?");
              if (confirmLogout) {
                  window.location.href = this.href;
              }
         });
    }


    // --- Main Tab Switching ---
    $('.main-tab-button').on('click', function() {
        var targetSelector = $(this).data('target');
        var $targetContent = $(targetSelector);

        if ($targetContent.length) {
            // Switch main tabs
            $('.main-tab-button').removeClass('active');
            $(this).addClass('active');
            $('.main-tab-content > .tab-content').removeClass('active'); // Target only direct children
            $targetContent.addClass('active');

            // Initialize or update charts if the target tab contains them
            if (targetSelector === '#tabs-2') {
                initializeOrUpdateProgressChart();
            } else if (targetSelector === '#tabs-3') {
                 initializeOrUpdateNutritionCharts();
                 // Ensure the correct inner nutrition tab is shown
                 const activeNutritionButton = $('#tabs-3 .tabs .tab-button.active');
                 if (activeNutritionButton.length) {
                     const targetNutritionTab = activeNutritionButton.data('tab');
                     $('#tabs-3 .nutrition-tab-content').removeClass('active');
                     $('#' + targetNutritionTab + '-content').addClass('active');
                 }
            }
        } else {
            console.warn("Main tab target content not found:", targetSelector);
        }
    });

    // --- Nutrition Inner Tab Switching ---
     $('.tabs .tab-button').on('click', function() {
          var tabId = $(this).data('tab');
          var $container = $(this).closest('.content-placeholder');

          $container.find('.tabs .tab-button').removeClass('active');
          $(this).addClass('active');

          $container.find('.nutrition-tab-content').removeClass('active');
          $('#' + tabId + '-content').addClass('active');

          // Re-initialize charts if switching back to a chart tab within nutrition
          if (tabId === 'calories' || tabId === 'macros') {
              initializeOrUpdateNutritionCharts();
          }
     });

    // --- Chart.js Implementations ---
    let progressChartInstance = null;
    let calorieChartInstance = null;
    let macroChartInstance = null;

    // Function to get placeholder data for the progress chart
    function getProgressChartData(period, measurement) {
        // --- Placeholder Data ---
        // In a real application, this data would be fetched based on period and measurement
        let labels = [];
        let data = [];
        let unit = $('#measurements option:selected').data('unit') || 'kg';
        let startDate = moment().subtract(6, 'days'); // Default to 1 week

        let days = 7;
        if (period === 'monthly') { startDate = moment().subtract(1, 'month'); days = 30; }
        else if (period === '3months') { startDate = moment().subtract(3, 'months'); days = 90; }
        else if (period === '6months') { startDate = moment().subtract(6, 'months'); days = 180; }
        else if (period === 'yearly') { startDate = moment().subtract(1, 'year'); days = 365; }
        // 'start' would require fetching the actual start date

        let startValue = 70; // Example start value
        if (measurement === 'neck') startValue = 38;
        else if (measurement === 'waist') startValue = 85;
        else if (measurement === 'hips') startValue = 100;

        for (let i = 0; i < days; i++) {
            labels.push(startDate.clone().add(i, 'days').toDate());
            // Simulate some data fluctuation
            data.push(startValue + (Math.random() * 4 - 2) * (measurement === 'weight' ? 1 : 0.5) - (i * 0.05)); // Simulate slight downward trend
        }

        return { labels, data, unit };
    }

    // Initialize or Update Progress Line Chart
    function initializeOrUpdateProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return; // Exit if canvas not found

        const measurementSelect = $('#measurements');
        const periodSelect = $('#graph-period');
        const chartTitle = $('#chart-title');

        const selectedMeasurement = measurementSelect.val();
        const selectedPeriod = periodSelect.val();
        const measurementText = measurementSelect.find('option:selected').text();
        const periodText = periodSelect.find('option:selected').text();

        // Update chart title
        chartTitle.text(`${measurementText} Progress (${periodText})`);

        // Get placeholder data
        const { labels, data, unit } = getProgressChartData(selectedPeriod, selectedMeasurement);

        // Destroy previous chart instance if it exists
        if (progressChartInstance) {
            progressChartInstance.destroy();
        }

        // Create new chart
        progressChartInstance = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${measurementText} (${unit})`,
                    data: data,
                    borderColor: 'rgba(218, 165, 32, 1)', // Goldenrod
                    backgroundColor: 'rgba(218, 165, 32, 0.1)',
                    borderWidth: 2,
                    tension: 0.1, // Makes the line slightly curved
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                             unit: labels.length > 90 ? 'month' : (labels.length > 7 ? 'week' : 'day'), // Adjust time unit based on data range
                             tooltipFormat: 'll' // e.g., Sep 4, 1986
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        beginAtZero: false, // Don't force y-axis to start at 0 for measurements like weight
                        title: {
                            display: true,
                            text: `${measurementText} (${unit})`
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    // Function to update Nutrition UI based on data
    function updateNutritionUI(calorieData, macroData, goalCalories, goalMacros) {
        // --- Update Calorie Breakdown ---
        const totalCalories = Object.values(calorieData).reduce((sum, val) => sum + val, 0);
        const exerciseCalories = 250; // Placeholder exercise calories

        $('[data-value="total-calories"]').text(totalCalories.toLocaleString());
        $('[data-value="exercise-calories"]').text(exerciseCalories.toLocaleString());
        $('[data-value="net-calories"]').text((totalCalories - exerciseCalories).toLocaleString());
        $('[data-value="goal-calories"]').text(goalCalories.toLocaleString());

        // Update meal percentages/calories
        const mealTargets = {
            'breakfast-calories': $('[data-value="breakfast-calories"]'),
            'lunch-calories': $('[data-value="lunch-calories"]'),
            'dinner-calories': $('[data-value="dinner-calories"]'),
            'snack-calories': $('[data-value="snack-calories"]')
        };
        for(const meal in calorieData) {
            const key = `${meal}-calories`;
            if (mealTargets[key]) {
                const percentage = totalCalories > 0 ? Math.round((calorieData[meal] / totalCalories) * 100) : 0;
                 mealTargets[key].text(`${percentage}% (${calorieData[meal].toLocaleString()} cal)`);
            }
        }

        // --- Update Nutrient Details (Basic Example - linking macros) ---
        $('[data-value="protein-total"]').text(`${macroData.protein} g`);
        $('[data-value="carbs-total"]').text(`${macroData.carbs} g`);
        $('[data-value="fat-total"]').text(`${macroData.fat} g`);
        // Add logic to calculate 'left' values based on goals if available

        // --- Update Macros Legend ---
        const totalGrams = macroData.carbs + macroData.fat + macroData.protein;
        const carbsPercent = totalGrams > 0 ? Math.round((macroData.carbs / totalGrams) * 100) : 0;
        const fatPercent = totalGrams > 0 ? Math.round((macroData.fat / totalGrams) * 100) : 0;
        // Ensure protein makes up the remainder to avoid rounding errors summing > 100%
        const proteinPercent = totalGrams > 0 ? (100 - carbsPercent - fatPercent) : 0;


        $('[data-value="carbs-grams"]').text(`${macroData.carbs}g`);
        $('[data-value="carbs-percentage"]').text(`${carbsPercent}%`);
        $('[data-value="fat-grams"]').text(`${macroData.fat}g`);
        $('[data-value="fat-percentage"]').text(`${fatPercent}%`);
        $('[data-value="protein-grams"]').text(`${macroData.protein}g`);
        $('[data-value="protein-percentage"]').text(`${proteinPercent}%`);

        // Update goal percentages (if provided)
        if (goalMacros) {
            $('[data-macro="carbs"] .goal-percentage').text(`${goalMacros.carbs}%`);
            $('[data-macro="fat"] .goal-percentage').text(`${goalMacros.fat}%`);
            $('[data-macro="protein"] .goal-percentage').text(`${goalMacros.protein}%`);
        }
    }


    // Initialize or Update Nutrition Pie Charts
    function initializeOrUpdateNutritionCharts() {
         // --- Placeholder Nutrition Data ---
         const calorieData = {
             breakfast: 350,
             lunch: 550,
             dinner: 600,
             snacks: 180
         };
         const macroData = { // In grams
             carbs: 195,
             fat: 60,
             protein: 75
         };
         const goalCalories = 1520; // From HTML
         const goalMacros = { // Percentages
             carbs: 50,
             fat: 30,
             protein: 20
         };

         // Update the UI text elements first
         updateNutritionUI(calorieData, macroData, goalCalories, goalMacros);


        // --- Calorie Chart ---
        const calorieCtx = document.getElementById('calorieChart');
        if (calorieCtx) {
            if (calorieChartInstance) {
                calorieChartInstance.destroy();
            }
            calorieChartInstance = new Chart(calorieCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
                    datasets: [{
                        label: 'Calories',
                        data: [
                            calorieData.breakfast,
                            calorieData.lunch,
                            calorieData.dinner,
                            calorieData.snacks
                        ],
                        backgroundColor: [
                            '#bf9a33', // breakfast color from legend
                            '#febd14', // lunch color
                            '#fece43', // dinner color
                            '#feda75'  // snacks color
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false // Using custom HTML legend
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed !== null) {
                                        label += context.parsed.toLocaleString() + ' cal';
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    cutout: '60%' // Make it a doughnut chart
                }
            });
        }


        // --- Macro Chart ---
        const macroCtx = document.getElementById('macroChart');
        if (macroCtx) {
            if (macroChartInstance) {
                macroChartInstance.destroy();
            }

            const totalGrams = macroData.carbs + macroData.fat + macroData.protein;

            macroChartInstance = new Chart(macroCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Carbohydrates', 'Fat', 'Protein'],
                    datasets: [{
                        label: 'Macronutrients (g)',
                        data: [
                            macroData.carbs,
                            macroData.fat,
                            macroData.protein
                        ],
                        backgroundColor: [
                            '#febd14', // carbs color from legend
                            '#fece43', // fat color
                            '#feda75'  // protein color
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false // Using custom HTML legend
                        },
                        tooltip: {
                             callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    let value = context.parsed || 0;
                                    let percentage = totalGrams > 0 ? Math.round((value / totalGrams) * 100) : 0;
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += value.toLocaleString() + 'g (' + percentage + '%)';
                                    return label;
                                }
                            }
                        }
                    },
                    cutout: '60%' // Make it a doughnut chart
                }
            });
        }
    }

    // --- Event Listeners for Chart Updates ---
    $('#measurements, #graph-period').on('change', function() {
        // Only update if the workout status tab is active
        if ($('#tabs-2').hasClass('active')) {
            initializeOrUpdateProgressChart();
        }
    });

    // --- Initial Chart Load on Page Ready ---
    // Check which tab is active initially and load its charts
    if ($('#tabs-2').hasClass('active')) {
        initializeOrUpdateProgressChart();
    } else if ($('#tabs-3').hasClass('active')) {
        initializeOrUpdateNutritionCharts();
    }

}); // End document ready