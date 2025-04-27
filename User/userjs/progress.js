document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    let workoutLineChart; 
    let calorieDoughnutChart;
    let macroDoughnutChart;

    const hamburgerButton = document.getElementById('hamburger-button');
    const closeButton = document.getElementById('close-button');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    function openSidebar() {
        if (!sidebar || !overlay || !hamburgerButton || !body) return;
        sidebar.classList.add('active');
        overlay.classList.add('active');
        hamburgerButton.setAttribute('aria-expanded', 'true');
        body.classList.add('sidebar-open');
    }

    function closeSidebar() {
        if (!sidebar || !overlay || !hamburgerButton || !body) return;
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        hamburgerButton.setAttribute('aria-expanded', 'false');
        body.classList.remove('sidebar-open');
    }

    if (hamburgerButton) hamburgerButton.addEventListener('click', openSidebar);
    if (closeButton) closeButton.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sidebar?.classList.contains('active')) {
            closeSidebar();
        }
    });

    document.querySelectorAll('.sidebar .nav-link:not([href^="#tabs-"])').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });

    const mainTabContentContainer = document.querySelector('.main-tab-content');
    const mainTabLinks = document.querySelectorAll('.nav-link[href^="#tabs-"]'); 
    const mainTabContents = mainTabContentContainer ? mainTabContentContainer.querySelectorAll(':scope > .tab-content') : [];
    const desktopNavLinks = document.querySelectorAll('.nav-menu-desktop .nav-link[href^="#tabs-"]');
    const sidebarNavLinks = document.querySelectorAll('.sidebar-menu .nav-link[href^="#tabs-"]');

    function showMainTab(targetTabId) {
        if (!targetTabId || !targetTabId.startsWith('#tabs-')) return false;

        const targetTab = document.querySelector(targetTabId);
        if (!targetTab || !mainTabContents.length) return false;

        mainTabContents.forEach(tab => {
            tab.classList.remove('active');
            tab.style.display = 'none';
        });
        targetTab.style.display = 'block';
        requestAnimationFrame(() => { 
            targetTab.classList.add('active');
        });

        desktopNavLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === targetTabId);
        });
        sidebarNavLinks.forEach(link => {
            link.classList.toggle('active-sidebar', link.getAttribute('href') === targetTabId);
        });

        if (window.location.hash !== targetTabId) {
            try {
                window.location.hash = targetTabId; 
            } catch (e) {
                window.location.hash = targetTabId;
            }
        }

        if (targetTabId === '#tabs-2' && workoutLineChart) {
        }
        if (targetTabId === '#tabs-3') {
        }


        return true; 
    }

    mainTabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const targetTabId = link.getAttribute('href');
            if (showMainTab(targetTabId)) {
                event.preventDefault(); 
                if (link.closest('.sidebar')) {
                    closeSidebar();
                }
            }
        });
    });

    function handleInitialTab() {
        let initialTabId = window.location.hash;
        let shown = false;
        if (initialTabId && initialTabId.startsWith('#tabs-')) {
            shown = showMainTab(initialTabId);
        }

        if (!shown && mainTabLinks.length > 0) {
            const firstValidTabLink = document.querySelector('.nav-menu-desktop .nav-link[href^="#tabs-"]') || document.querySelector('.sidebar-menu .nav-link[href^="#tabs-"]');
            if (firstValidTabLink) {
                 initialTabId = firstValidTabLink.getAttribute('href');
                 showMainTab(initialTabId);
            }
        } else if (!shown && mainTabContents.length > 0) {
             mainTabContents[0].style.display = 'block';
             mainTabContents[0].classList.add('active');
             const firstTabId = mainTabContents[0].id;
             if (firstTabId) {
                desktopNavLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${firstTabId}`));
                sidebarNavLinks.forEach(link => link.classList.toggle('active-sidebar', link.getAttribute('href') === `#${firstTabId}`));
             }
        }
    }

    handleInitialTab(); 

    window.addEventListener('popstate', handleInitialTab);


    const calendarGrid = document.querySelector('.calendar-grid');
    if (calendarGrid) {
        calendarGrid.addEventListener('click', (event) => {
            const clickedButton = event.target.closest('.date-cell:not(.empty) button');
            if (clickedButton) {
                const previouslySelected = calendarGrid.querySelector('.date-cell button.selected');
                if (previouslySelected) {
                    previouslySelected.classList.remove('selected');
                }
                clickedButton.classList.add('selected');
            }
        });
        const prevButton = document.querySelector('.cal-nav.prev');
        const nextButton = document.querySelector('.cal-nav.next');
        const monthYearSpan = document.querySelector('.current-month-year');
        if (prevButton) prevButton.addEventListener('click', () => alert('Prev Month clicked - Full implementation needed'));
        if (nextButton) nextButton.addEventListener('click', () => alert('Next Month clicked - Full implementation needed'));
    }

    const measurementSelect = document.getElementById('measurements');
    const periodSelect = document.getElementById('graph-period');
    const chartTitle = document.getElementById('chart-title');
    const chartCanvas = document.getElementById('myChart');

    if (chartCanvas && measurementSelect && periodSelect && chartTitle) {
        const ctxLine = chartCanvas.getContext('2d');

        function generateSampleData(measurement, period) {
            let labels = [];
            let dataPoints = [];
            let baseValue, fluctuation;
            const numPointsMap = { 
                'weekly': 7, 'monthly': 30, '3months': 13, 
                '6months': 13, 
                'yearly': 12, 
                'start': 25 
            };
            const numPoints = numPointsMap[period] || 7;
            const unit = measurementSelect.options[measurementSelect.selectedIndex].dataset.unit || '';

            switch (measurement) {
                case 'weight': baseValue = 80; fluctuation = 1.0; break;
                case 'neck': baseValue = 38; fluctuation = 0.3; break;
                case 'waist': baseValue = 90; fluctuation = 0.8; break;
                case 'hips': baseValue = 100; fluctuation = 0.7; break;
                default: baseValue = 50; fluctuation = 1;
            }

            const now = moment();
            let startDate;
            let timeUnit, format;

            switch (period) {
                case 'weekly': startDate = now.clone().subtract(numPoints - 1, 'days'); timeUnit = 'day'; format = 'ddd D'; break;
                case 'monthly': startDate = now.clone().subtract(numPoints - 1, 'days'); timeUnit = 'day'; format = 'MMM D'; break;
                case '3months': startDate = now.clone().subtract(numPoints - 1, 'weeks'); timeUnit = 'week'; format = 'MMM D'; break;
                case '6months': startDate = now.clone().subtract((numPoints - 1) * 2, 'weeks'); timeUnit = 'week'; format = 'MMM D'; break; 
                case 'yearly': startDate = now.clone().subtract(numPoints - 1, 'months'); timeUnit = 'month'; format = 'MMM YY'; break;
                case 'start': startDate = now.clone().subtract(numPoints * 10, 'days'); timeUnit = 'day'; format = 'MMM D'; break; 
                default: startDate = now.clone().subtract(6, 'days'); timeUnit = 'day'; format = 'ddd D';
            }


            let currentValue = baseValue;
            for (let i = 0; i < numPoints; i++) {
                let currentDate;
                 if (period === '6months') {
                     currentDate = startDate.clone().add(i * 2, 'weeks');
                 } else if (period === 'start') {
                      currentDate = startDate.clone().add(i * 10, 'days');
                 }
                  else {
                      currentDate = startDate.clone().add(i, timeUnit);
                  }

                labels.push(currentDate); 
                let trendFactor = (measurement === 'neck') ? (Math.random() - 0.5) * 0.1 : -0.05 * (i / numPoints);
                currentValue += trendFactor + (Math.random() - 0.5) * fluctuation;
                dataPoints.push(Math.max(0, currentValue).toFixed(1));
            }

            return { labels: labels, dataPoints: dataPoints, unit: unit, format: format, timeUnit: timeUnit };
        }

        function updateWorkoutChart() {
            const selectedMeasurement = measurementSelect.value;
            const selectedPeriod = periodSelect.value;
            const selectedMeasurementText = measurementSelect.options[measurementSelect.selectedIndex].text;
            const selectedPeriodText = periodSelect.options[periodSelect.selectedIndex].text;

            const chartData = generateSampleData(selectedMeasurement, selectedPeriod);

            chartTitle.textContent = `${selectedMeasurementText} Progress (${selectedPeriodText})`;

            if (workoutLineChart) {
                workoutLineChart.destroy();
            }

            workoutLineChart = new Chart(ctxLine, {
                type: 'line',
                data: {
                    datasets: [{
                        label: `${selectedMeasurementText}`,
                        data: chartData.dataPoints.map((value, index) => ({
                            x: chartData.labels[index], 
                            y: value
                        })),
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-line-color').trim() || 'rgb(218, 165, 32)',
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-line-bg').trim() || 'rgba(218, 165, 32, 0.2)',
                        tension: 0.1,
                        fill: true,
                        pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-line-color').trim() || 'rgb(218, 165, 32)',
                        pointRadius: 4,
                        pointHoverRadius: 7,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'time', 
                            time: {
                                unit: chartData.timeUnit, 
                                tooltipFormat: 'll',
                                displayFormats: { 
                                    day: 'MMM D',
                                    week: 'MMM D',
                                    month: 'MMM YYYY',
                                    year: 'YYYY'
                                }
                            },
                            title: {
                                display: true,
                                text: 'Date / Time Period'
                            },
                            grid: {
                                display: false 
                            }
                        },
                        y: {
                            beginAtZero: false, 
                            title: {
                                display: true,
                                text: `Measurement (${chartData.unit})`
                            },
                            grid: {
                                color: '#e0e0e0', 
                                borderDash: [2, 3], 
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y + ' ' + chartData.unit;
                                    }
                                    return label;
                                }
                            }
                        },
                        legend: {
                             display: false 
                         }
                    },
                    interaction: { 
                         intersect: false,
                         mode: 'index',
                    },
                }
            });
        }

        measurementSelect.addEventListener('change', updateWorkoutChart);
        periodSelect.addEventListener('change', updateWorkoutChart);
        updateWorkoutChart(); 

    } else {
         console.warn("Workout chart canvas or controls not found. Skipping chart initialization.");
    }


    const nutritionData = {
        calories: {
            goal: 1850, 
            breakfast: 420,
            lunch: 610,
            dinner: 550,
            snacks: 230,
            exercise: 350 
        },
        nutrients: {
            protein: [95, 93, 'g'], 
            carbohydrates: [220, 231, 'g'],
            fiber: [28, 30, 'g'],
            sugar: [50, 70, 'g'],
            fat: [65, 62, 'g'], 
            saturated_fat: [18, 20, 'g'],
            polyunsaturated_fat: [15, 0, 'g'],
            monounsaturated_fat: [25, 0, 'g'], 
            trans_fat: [0.5, 0, 'g'], 
            cholesterol: [250, 300, 'mg'],
            sodium: [1950, 2300, 'mg'],
            potassium: [3100, 3500, 'mg'],
            vitamin_a: [85, 100, '%'],
            vitamin_c: [110, 100, '%'], 
            calcium: [90, 100, '%'],
            iron: [75, 100, '%']
        },
        macrosGoalPercent: { 
            carbs: 50,
            fat: 30,   
            protein: 20 
        }
    };

    function getCssVariable(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    function updateNutritionDisplay(data) {
        const totalCaloriesConsumed = data.calories.breakfast + data.calories.lunch + data.calories.dinner + data.calories.snacks;
        const netCalories = totalCaloriesConsumed - data.calories.exercise;
        const goalCalories = data.calories.goal;

        document.querySelector('[data-value="breakfast-calories"]').textContent = `${Math.round((data.calories.breakfast / totalCaloriesConsumed) * 100) || 0}% (${data.calories.breakfast} cal)`;
        document.querySelector('[data-value="lunch-calories"]').textContent = `${Math.round((data.calories.lunch / totalCaloriesConsumed) * 100) || 0}% (${data.calories.lunch} cal)`;
        document.querySelector('[data-value="dinner-calories"]').textContent = `${Math.round((data.calories.dinner / totalCaloriesConsumed) * 100) || 0}% (${data.calories.dinner} cal)`;
        document.querySelector('[data-value="snack-calories"]').textContent = `${Math.round((data.calories.snacks / totalCaloriesConsumed) * 100) || 0}% (${data.calories.snacks} cal)`;

        document.querySelector('[data-value="total-calories"]').textContent = totalCaloriesConsumed.toLocaleString();
        document.querySelector('[data-value="exercise-calories"]').textContent = `- ${data.calories.exercise.toLocaleString()} cal`; 
        document.querySelector('[data-value="net-calories"]').textContent = netCalories.toLocaleString();
        document.querySelector('[data-value="goal-calories"]').textContent = goalCalories.toLocaleString();

        const calorieCanvas = document.getElementById('calorieChart');
        if (calorieCanvas) {
            const ctxCalorie = calorieCanvas.getContext('2d');
            if (calorieDoughnutChart) calorieDoughnutChart.destroy(); 

            calorieDoughnutChart = new Chart(ctxCalorie, {
                type: 'doughnut',
                data: {
                    labels: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
                    datasets: [{
                        label: 'Calories by Meal',
                        data: [
                            data.calories.breakfast,
                            data.calories.lunch,
                            data.calories.dinner,
                            data.calories.snacks
                        ],
                        backgroundColor: [
                            getCssVariable('--chart-calorie-breakfast') || '#bf9a33',
                            getCssVariable('--chart-calorie-lunch') || '#febd14',
                            getCssVariable('--chart-calorie-dinner') || '#fece43',
                            getCssVariable('--chart-calorie-snacks') || '#feda75'
                        ],
                        borderColor: getCssVariable('--card-bg') || '#ffffff', 
                        borderWidth: 2,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }, 
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) label += ': ';
                                    label += context.parsed.toLocaleString() + ' cal';
                                    return label;
                                }
                            }
                        }
                    },
                    cutout: '70%' 
                }
            });
        }

        const nutrientList = document.querySelector('.nutrient-list');
        if (nutrientList) {
            Object.keys(data.nutrients).forEach(key => {
                const nutrientItem = nutrientList.querySelector(`li[data-nutrient="${key}"]`);
                if (nutrientItem) {
                    const [total, goal, unit] = data.nutrients[key];
                    const left = Math.max(0, goal - total); 
                    const unitDisplay = unit !== '%' ? ` ${unit}` : unit; 

                    const spans = nutrientItem.querySelectorAll('span');
                    spans[1].textContent = `${total.toLocaleString()}${unitDisplay}`; 
                    spans[2].textContent = `${goal.toLocaleString()}${unitDisplay}`; 
                    spans[3].textContent = `${left.toLocaleString()}${unitDisplay}`; 
                }
            });
        }

        const totalProteinGrams = data.nutrients.protein[0];
        const totalCarbsGrams = data.nutrients.carbohydrates[0];
        const totalFatGrams = data.nutrients.fat[0];

        const totalMacroGrams = totalProteinGrams + totalCarbsGrams + totalFatGrams;
        const percentCarbs = totalMacroGrams > 0 ? Math.round((totalCarbsGrams / totalMacroGrams) * 100) : 0;
        const percentFat = totalMacroGrams > 0 ? Math.round((totalFatGrams / totalMacroGrams) * 100) : 0;
        const percentProtein = totalMacroGrams > 0 ? (100 - percentCarbs - percentFat) : 0;


        const carbsLegend = document.querySelector('.legend-item[data-macro="carbs"]');
        if (carbsLegend) {
            carbsLegend.querySelector('span:nth-child(2)').textContent = `Carbohydrates (${totalCarbsGrams.toLocaleString()}g)`;
            carbsLegend.querySelector('.percentage').textContent = `${percentCarbs}%`;
            carbsLegend.querySelector('.goal-percentage').textContent = `(${data.macrosGoalPercent.carbs}%)`; 
        }
        const fatLegend = document.querySelector('.legend-item[data-macro="fat"]');
         if (fatLegend) {
            fatLegend.querySelector('span:nth-child(2)').textContent = `Fat (${totalFatGrams.toLocaleString()}g)`;
            fatLegend.querySelector('.percentage').textContent = `${percentFat}%`;
            fatLegend.querySelector('.goal-percentage').textContent = `(${data.macrosGoalPercent.fat}%)`;
        }
        const proteinLegend = document.querySelector('.legend-item[data-macro="protein"]');
         if (proteinLegend) {
            proteinLegend.querySelector('span:nth-child(2)').textContent = `Protein (${totalProteinGrams.toLocaleString()}g)`;
            proteinLegend.querySelector('.percentage').textContent = `${percentProtein}%`;
            proteinLegend.querySelector('.goal-percentage').textContent = `(${data.macrosGoalPercent.protein}%)`;
        }


        const macroCanvas = document.getElementById('macroChart');
        if (macroCanvas) {
            const ctxMacro = macroCanvas.getContext('2d');
             if (macroDoughnutChart) macroDoughnutChart.destroy();

            macroDoughnutChart = new Chart(ctxMacro, {
                type: 'doughnut',
                data: {
                    labels: ['Carbs', 'Fat', 'Protein'],
                    datasets: [{
                        label: 'Macronutrients',
                        data: [ percentCarbs, percentFat, percentProtein ],
                        backgroundColor: [
                            getCssVariable('--chart-macro-carbs') || '#c49a3c',
                            getCssVariable('--chart-macro-fat') || '#e6c56d',
                            getCssVariable('--chart-macro-protein') || '#a47e2b'
                        ],
                        borderColor: getCssVariable('--card-bg') || '#ffffff',
                        borderWidth: 2,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                     plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) label += ': ';
                                    label += context.parsed.toFixed(0) + '%';
                                    return label;
                                }
                            }
                        }
                    },
                    cutout: '70%'
                }
            });
        }
    } 
    const nutritionTabContainer = document.querySelector('#tabs-3');
    if (nutritionTabContainer) {
        const nutritionTabNav = nutritionTabContainer.querySelector('nav.tabs');
        const nutritionTabButtons = nutritionTabNav?.querySelectorAll('.tab-button');
        const nutritionTabContents = nutritionTabContainer.querySelectorAll(':scope > .content-placeholder > div.tab-content'); 

        if (nutritionTabNav && nutritionTabButtons && nutritionTabContents) {
            nutritionTabNav.addEventListener('click', (e) => {
                const clickedButton = e.target.closest('.tab-button');
                if (!clickedButton || clickedButton.classList.contains('active')) return; 

                const targetTabId = clickedButton.dataset.tab + '-content'; 
                nutritionTabButtons.forEach(button => button.classList.remove('active'));
                nutritionTabContents.forEach(content => content.classList.remove('active'));

                clickedButton.classList.add('active');
                const newActiveContent = nutritionTabContainer.querySelector(`#${targetTabId}`);
                if (newActiveContent) {
                    newActiveContent.classList.add('active');
                }
            });
        }
    }

    updateNutritionDisplay(nutritionData); 

}); 
