document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // --- Sidebar Functionality ---
    const hamburgerButton = document.getElementById('hamburger-button');
    const closeButton = document.getElementById('close-button');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('overlay'); 

    function openSidebar() {
        if (!sidebar || !sidebarOverlay || !hamburgerButton || !body) return;
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        hamburgerButton.setAttribute('aria-expanded', 'true');
        body.classList.add('sidebar-open');
    }

    function closeSidebar() {
        if (!sidebar || !sidebarOverlay || !hamburgerButton || !body) return;
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        hamburgerButton.setAttribute('aria-expanded', 'false');
        body.classList.remove('sidebar-open');
    }

    if (hamburgerButton) hamburgerButton.addEventListener('click', openSidebar);
    if (closeButton) closeButton.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (sidebar?.classList.contains('active')) {
                closeSidebar();
            }
            if (logMealModal?.classList.contains('active')) {
                closeLogMealModal(); 
            }
        }
    });

    document.querySelectorAll('.sidebar .nav-link:not([href^="#tabs-"])').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });

    // --- Main Tab Switching Logic ---
    const mainTabContentContainer = document.querySelector('.main-tab-content');
    const mainTabLinks = document.querySelectorAll('.nav-link[href^="#tabs-"]');
    const mainTabContents = mainTabContentContainer ? mainTabContentContainer.querySelectorAll(':scope > .tab-content') : [];
    const desktopNavLinks = document.querySelectorAll('.nav-menu-desktop .nav-link[href^="#tabs-"]');
    const sidebarNavLinks = document.querySelectorAll('.sidebar-menu .nav-link[href^="#tabs-"]');

    function showMainTab(targetTabId) {
        if (!targetTabId || !targetTabId.startsWith('#tabs-')) return false;
        const targetTab = document.querySelector(targetTabId);
        if (!targetTab) {
             const firstValidTabLink = document.querySelector('.nav-menu-desktop .nav-link[href^="#tabs-"], .sidebar-menu .nav-link[href^="#tabs-"]');
             return firstValidTabLink ? showMainTab(firstValidTabLink.getAttribute('href')) : false;
        }
        if (!mainTabContents.length) return false;

        mainTabContents.forEach(tab => {
            tab.classList.remove('active');
            tab.style.display = 'none';
        });

        targetTab.style.display = 'block';
        requestAnimationFrame(() => { targetTab.classList.add('active'); });

        desktopNavLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === targetTabId));
        sidebarNavLinks.forEach(link => link.classList.toggle('active-sidebar', link.getAttribute('href') === targetTabId));

        if (window.location.hash !== targetTabId) {
            if (history.pushState) {
                history.pushState(null, null, targetTabId);
            } else {
                window.location.hash = targetTabId;
            }
        }
        return true;
    }

    mainTabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const targetTabId = link.getAttribute('href');
            if (showMainTab(targetTabId)) {
                event.preventDefault();
                if (link.closest('.sidebar')) closeSidebar();
            }
        });
    });

    function handleInitialTab() {
        let initialTabId = window.location.hash;
        let shown = false;
        if (initialTabId && initialTabId.startsWith('#tabs-')) {
            shown = showMainTab(initialTabId);
        }
        if (!shown) {
            const firstValidTabLink = document.querySelector('.nav-menu-desktop .nav-link[href^="#tabs-"], .sidebar-menu .nav-link[href^="#tabs-"]');
            if (firstValidTabLink) {
                 showMainTab(firstValidTabLink.getAttribute('href'));
            } else if (mainTabContents.length > 0) {
                mainTabContents[0].style.display = 'block';
                mainTabContents[0].classList.add('active');
                const firstTabIdFallback = '#' + mainTabContents[0].id;
                 desktopNavLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === firstTabIdFallback));
                 sidebarNavLinks.forEach(link => link.classList.toggle('active-sidebar', link.getAttribute('href') === firstTabIdFallback));
            }
        }
    }
    handleInitialTab();
    window.addEventListener('popstate', handleInitialTab);


    // --- Calendar Widget Interaction & Date Selection ---
    const calendarGrid = document.querySelector('.calendar-grid');
    const currentMonthYearSpan = document.querySelector('.current-month-year'); 
    let selectedDate = moment().format('YYYY-MM-DD'); 

    function updateSelectedDate(newDate) {
        selectedDate = newDate;
        console.log("Selected Date:", selectedDate);
        // Trigger data update/load for the new date
        loadAndDisplayDataForDate(selectedDate);
    }

    if (calendarGrid) {
        // Set initial selected date display based on default
        const initialSelectedButton = calendarGrid.querySelector(`button[data-date="${selectedDate}"]`);
        if(initialSelectedButton) {
             calendarGrid.querySelector('button.selected')?.classList.remove('selected');
             initialSelectedButton.classList.add('selected');
        } else {
            // If today isn't in the static HTML, select the default one
            const defaultSelected = calendarGrid.querySelector('button.selected');
             if(defaultSelected && defaultSelected.dataset.date) {
                updateSelectedDate(defaultSelected.dataset.date);
            }
        }


        calendarGrid.addEventListener('click', (event) => {
            const clickedButton = event.target.closest('.date-cell:not(.empty) button');
            if (clickedButton) {
                const previouslySelected = calendarGrid.querySelector('.date-cell button.selected');
                if (previouslySelected) previouslySelected.classList.remove('selected');
                clickedButton.classList.add('selected');

                // Get date from button's data attribute (requires adding data-date="YYYY-MM-DD" to buttons)
                 const dateStr = clickedButton.dataset.date;
                 if (dateStr) {
                     updateSelectedDate(dateStr);
                 } else {
                    // Fallback if data-date is missing (less reliable)
                    const day = clickedButton.textContent;
                    const monthYearText = currentMonthYearSpan ? currentMonthYearSpan.textContent : moment().format('MMMM YYYY');
                    try {
                         // Attempt to construct date - might be inaccurate without full calendar logic
                         const guessedDate = moment(monthYearText + " " + day, "MMMM YYYY D").format('YYYY-MM-DD');
                         updateSelectedDate(guessedDate);
                    } catch(e) {
                         console.error("Could not determine date from calendar button.");
                    }
                 }
            }
        });

        // Basic prev/next month buttons (requires full calendar generation logic)
        const prevButton = document.querySelector('.cal-nav.prev');
        const nextButton = document.querySelector('.cal-nav.next');
        if (prevButton) prevButton.addEventListener('click', () => alert('Prev Month - Full calendar logic needed'));
        if (nextButton) nextButton.addEventListener('click', () => alert('Next Month - Full calendar logic needed'));
    }


    // --- Nutrition Status (#tabs-3) Logic ---

    let globalGoals = {
        calories: 1850,
        exercise: 0, 
        nutrients: { 
            protein: 76, carbs: 190, fiber: 25, sugar: 57,
            fat: 51, satfat: 17, polyfat: 0, monofat: 0,
            transfat: 0, cholesterol: 300, sodium: 2300,
            potassium: 3500, vita: 100, vitc: 100,
            calcium: 100, iron: 100
        },
        macrosGoalPercent: { carbs: 50, fat: 30, protein: 20 }
    };

    let dailyFoodLog = {
    };
    let dailyExerciseLog = {
    };

    // Map data-id from HTML to the globalGoals structure for editing
    const goalDataMap = {
        'calorie-goal': ['calories'],
        'exercise-calories': ['exercise'], 
        'protein-goal': ['nutrients', 'protein'],
        'carbs-goal': ['nutrients', 'carbs'],
        'fiber-goal': ['nutrients', 'fiber'],
        'sugar-goal': ['nutrients', 'sugar'],
        'fat-goal': ['nutrients', 'fat'],
        'satfat-goal': ['nutrients', 'satfat'],
        'polyfat-goal': ['nutrients', 'polyfat'],
        'monofat-goal': ['nutrients', 'monofat'],
        'transfat-goal': ['nutrients', 'transfat'],
        'cholesterol-goal': ['nutrients', 'cholesterol'],
        'sodium-goal': ['nutrients', 'sodium'],
        'potassium-goal': ['nutrients', 'potassium'],
        'vita-goal': ['nutrients', 'vita'],
        'vitc-goal': ['nutrients', 'vitc'],
        'calcium-goal': ['nutrients', 'calcium'],
        'iron-goal': ['nutrients', 'iron']
    };

     // --- Load and Display Data for Selected Date ---
     function loadAndDisplayDataForDate(dateStr) {
         const todaysLog = dailyFoodLog[dateStr] || [];
         const todaysExercise = dailyExerciseLog[dateStr] || 0; 

         // Calculate totals for the day from the log
         const dailyTotals = {
             calories: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 },
             nutrients: { 
                 protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 0, satfat: 0,
                 polyfat: 0, monofat: 0, transfat: 0, cholesterol: 0, sodium: 0,
                 potassium: 0, vita: 0, vitc: 0, calcium: 0, iron: 0
             }
         };

         todaysLog.forEach(item => {
             const mealLower = item.meal.toLowerCase();
             if (dailyTotals.calories.hasOwnProperty(mealLower)) {
                 dailyTotals.calories[mealLower] += (item.calories || 0);
             }

             // Add other nutrients (make sure keys match globalGoals.nutrients)
             dailyTotals.nutrients.protein += (item.protein || 0);
             dailyTotals.nutrients.carbs += (item.carbs || 0);
             dailyTotals.nutrients.fat += (item.fat || 0);

         });

         // Combine daily totals with global goals for display
         const displayData = {
             calories: {
                 goal: globalGoals.calories,
                 exercise: todaysExercise, 
                 breakfast: dailyTotals.calories.breakfast,
                 lunch: dailyTotals.calories.lunch,
                 dinner: dailyTotals.calories.dinner,
                 snacks: dailyTotals.calories.snacks
             },
             nutrients: {}, // Will hold [total, goal, unit]
             macrosGoalPercent: globalGoals.macrosGoalPercent
         };

         // Populate displayData.nutrients with [total, goal, unit]
         const nutrientUnits = { 
             protein: 'g', carbs: 'g', fiber: 'g', sugar: 'g', fat: 'g', satfat: 'g',
             polyfat: 'g', monofat: 'g', transfat: 'g', cholesterol: 'mg', sodium: 'mg',
             potassium: 'mg', vita: '%', vitc: '%', calcium: '%', iron: '%'
         };
         for (const key in globalGoals.nutrients) {
             displayData.nutrients[key] = [
                 dailyTotals.nutrients[key] || 0,
                 globalGoals.nutrients[key],
                 nutrientUnits[key] || '' 
             ];
         }

         updateNutritionDisplayUI(displayData);
     }

    // Function to update ONLY the UI elements (no chart logic)
    function updateNutritionDisplayUI(displayData) {
        if (!displayData) return;

        const caloriesContent = document.getElementById('calories-content');
        const nutrientsContent = document.getElementById('nutrients-content');
        const macrosContent = document.getElementById('macros-content');

        // --- Update Calories Tab UI ---
        if (caloriesContent && displayData.calories) {
            const totalCaloriesConsumed = (displayData.calories.breakfast || 0) + (displayData.calories.lunch || 0) + (displayData.calories.dinner || 0) + (displayData.calories.snacks || 0);
            const netCalories = totalCaloriesConsumed - (displayData.calories.exercise || 0);
            const goalCalories = displayData.calories.goal || 0;

            const updateText = (selector, value) => {
                const element = caloriesContent.querySelector(selector);
                if (element) element.textContent = value;
            };
            const calcPercent = (value) => totalCaloriesConsumed > 0 ? Math.round((value / totalCaloriesConsumed) * 100) : 0;

            updateText('[data-value="breakfast-calories"]', `${calcPercent(displayData.calories.breakfast || 0)}% (${(displayData.calories.breakfast || 0)} cal)`);
            updateText('[data-value="lunch-calories"]', `${calcPercent(displayData.calories.lunch || 0)}% (${(displayData.calories.lunch || 0)} cal)`);
            updateText('[data-value="dinner-calories"]', `${calcPercent(displayData.calories.dinner || 0)}% (${(displayData.calories.dinner || 0)} cal)`);
            updateText('[data-value="snack-calories"]', `${calcPercent(displayData.calories.snacks || 0)}% (${(displayData.calories.snacks || 0)} cal)`);

            updateText('[data-value="total-calories"]', totalCaloriesConsumed.toLocaleString());
            const exerciseValue = displayData.calories.exercise || 0;
            updateText('[data-value="exercise-calories"]', `- ${exerciseValue.toLocaleString()} cal`);
            updateText('[data-value="net-calories"]', netCalories.toLocaleString());
            updateText('[data-value="goal-calories"]', goalCalories.toLocaleString());
        }

        // --- Update Nutrients Tab UI ---
        if (nutrientsContent && displayData.nutrients) {
            const nutrientList = nutrientsContent.querySelector('.nutrient-list');
            if (nutrientList) {
                 // Map data-nutrient attribute to internal data key used in displayData
                const nutrientKeyMap = {
                    protein: 'protein', carbohydrates: 'carbs', fiber: 'fiber', sugar: 'sugar',
                    fat: 'fat', saturated_fat: 'satfat', polyunsaturated_fat: 'polyfat',
                    monounsaturated_fat: 'monofat', trans_fat: 'transfat', cholesterol: 'cholesterol',
                    sodium: 'sodium', potassium: 'potassium', vitamin_a: 'vita', vitamin_c: 'vitc',
                    calcium: 'calcium', iron: 'iron'
                };
                Object.entries(nutrientKeyMap).forEach(([displayKey, dataKey]) => {
                     const nutrientItem = nutrientList.querySelector(`li[data-nutrient="${displayKey}"]`);
                     if (nutrientItem && displayData.nutrients[dataKey]) {
                        const [total = 0, goal = 0, unit = ''] = displayData.nutrients[dataKey];
                        const left = Math.max(0, goal - total);
                        const unitDisplay = unit === '%' ? ' %' : (unit ? ` ${unit}` : '');

                        // Use specific data-value attributes for updating
                        const totalSpan = nutrientItem.querySelector(`[data-value="${dataKey}-total"]`);
                        const goalSpan = nutrientItem.querySelector(`[data-id="${dataKey}-goal"]`); 
                        const leftSpan = nutrientItem.querySelector(`[data-value="${dataKey}-left"]`);

                        if (totalSpan) totalSpan.textContent = `${total.toLocaleString()}${unitDisplay}`;
                        if (goalSpan) goalSpan.textContent = `${goal.toLocaleString()}${unitDisplay}`;
                        if (leftSpan) leftSpan.textContent = `${left.toLocaleString()}${unitDisplay}`;

                    } else if(nutrientItem) {
                        const spans = nutrientItem.querySelectorAll('span');
                         if (spans.length >= 4) {
                             spans[1].textContent = `0${spans[2].textContent.match(/\s(.*)/)?.[1] || ''}`;
                             spans[3].textContent = spans[2].textContent;
                         }
                    }
                });
            }
        }

        if (macrosContent && displayData.nutrients && displayData.macrosGoalPercent) {

            const totalProteinGrams = displayData.nutrients.protein ? displayData.nutrients.protein[0] || 0 : 0;
            const totalCarbsGrams = displayData.nutrients.carbs ? displayData.nutrients.carbs[0] || 0 : 0;
            const totalFatGrams = displayData.nutrients.fat ? displayData.nutrients.fat[0] || 0 : 0;
            const totalMacroGrams = totalProteinGrams + totalCarbsGrams + totalFatGrams;

            const percentCarbs = totalMacroGrams > 0 ? Math.round((totalCarbsGrams / totalMacroGrams) * 100) : 0;
            const percentFat = totalMacroGrams > 0 ? Math.round((totalFatGrams / totalMacroGrams) * 100) : 0;
            let percentProtein = totalMacroGrams > 0 ? Math.max(0, 100 - percentCarbs - percentFat) : 0;

            const updateLegend = (macro, grams, currentPercent, goalPercent) => {
                 const legendItem = macrosContent.querySelector(`.legend-item[data-macro="${macro}"]`);
                 if (legendItem) {
                     const nameSpan = legendItem.querySelector('span:nth-child(2)');
                     const percentSpan = legendItem.querySelector('.percentage');
                     const goalSpan = legendItem.querySelector('.goal-percentage');
                     if(nameSpan) nameSpan.textContent = `${macro.charAt(0).toUpperCase() + macro.slice(1)} (${grams.toLocaleString()}g)`;
                     if(percentSpan) percentSpan.textContent = `${currentPercent}%`;
                     if(goalSpan) goalSpan.textContent = `(${goalPercent}%)`;
                 }
            };
            updateLegend('carbs', totalCarbsGrams, percentCarbs, displayData.macrosGoalPercent.carbs || 0);
            updateLegend('fat', totalFatGrams, percentFat, displayData.macrosGoalPercent.fat || 0);
            updateLegend('protein', totalProteinGrams, percentProtein, displayData.macrosGoalPercent.protein || 0);
        }
    }

    // --- Nutrition Inner Tab Switching ---
    const nutritionTabContainer = document.querySelector('#tabs-3 .content-placeholder');
     if (nutritionTabContainer) {
        const nutritionTabNav = nutritionTabContainer.querySelector('nav.tabs');
        const nutritionTabButtons = nutritionTabNav?.querySelectorAll('.tab-button');
        const nutritionTabContents = nutritionTabContainer.querySelectorAll(':scope > div.nutrition-tab-content');
        if (nutritionTabNav && nutritionTabButtons && nutritionTabContents) {
            nutritionTabNav.addEventListener('click', (e) => {
                 const clickedButton = e.target.closest('.tab-button');
                if (!clickedButton || clickedButton.classList.contains('active')) return;
                const targetTabId = clickedButton.dataset.tab + '-content';
                nutritionTabButtons.forEach(button => button.classList.remove('active'));
                nutritionTabContents.forEach(content => content.classList.remove('active'));
                clickedButton.classList.add('active');
                const newActiveContent = nutritionTabContainer.querySelector(`#${targetTabId}`);
                if (newActiveContent) newActiveContent.classList.add('active');
            });
             const initialActiveButton = nutritionTabNav.querySelector('.tab-button.active');
             const initialActiveTabId = initialActiveButton ? initialActiveButton.dataset.tab + '-content' : 'calories-content';
             nutritionTabContents.forEach(content => {
                 content.classList.toggle('active', content.id === initialActiveTabId);
             });
        }
     }

    // --- Event Handlers for Editable Fields and Add Food ---
    function handleEditClick(event) {
        const target = event.target;
        if (!target.matches('[data-editable="true"]')) return;

        const id = target.dataset.id;
        const type = target.dataset.type || 'text';
        const label = target.dataset.label || 'value';

        // Determine if it's a global goal or daily exercise
        const isExercise = id === 'exercise-calories';
        const dataPath = !isExercise ? goalDataMap[id] : null; 

        const currentValueText = target.textContent || '';
        const currentNumericValue = parseFloat(currentValueText.replace(/[^0-9.-]+/g, "")) || 0;

        const newValueRaw = prompt(`Enter new ${label}:`, currentNumericValue);
        if (newValueRaw === null) return; 

        if (type === 'number') {
            const newValue = parseFloat(newValueRaw);
            if (isNaN(newValue) || newValue < 0) {
                alert('Invalid input. Please enter a non-negative number.');
                return;
            }
            try {
                if (isExercise) {
      
                    dailyExerciseLog[selectedDate] = newValue;

                } else if (dataPath) {
     
                    if (dataPath.length === 1) { 
                        globalGoals[dataPath[0]] = newValue;
                    } else if (dataPath.length === 2) { // 
                        globalGoals[dataPath[0]][dataPath[1]] = newValue;
                    } else { throw new Error("Invalid goal data path length"); }
              
                } else {
                     console.error("Could not determine target for editable ID:", id);
                     return;
                }

                loadAndDisplayDataForDate(selectedDate);

            } catch (e) {
                console.error("Error updating data:", e);
                alert("An error occurred while updating the value.");
            }
        }
    }

    // --- Log Meal Modal Elements and Logic ---
    const logMealModal = document.getElementById('log-meal-modal');
    const logMealForm = document.getElementById('log-meal-form');
    const logMealCancelButton = document.getElementById('log-meal-cancel-button');
    const logMealCloseButton = logMealModal?.querySelector('.modal-close-btn');
    const logMealTitleDateSpan = document.getElementById('log-meal-modal-date');
    const logMealTypeSelect = document.getElementById('log-meal-type');
    const logMealDateHiddenInput = document.getElementById('log-meal-date-hidden');
    const logMealValidationError = document.getElementById('log-meal-validation-error');
    const loggedItemsList = document.getElementById('logged-items-list');
    const loggedItemsDateDisplay = document.getElementById('logged-items-date-display');


    function openLogMealModal(mealType, dateStr) {
        if (!logMealModal || !logMealTypeSelect || !logMealTitleDateSpan || !logMealDateHiddenInput || !loggedItemsList || !loggedItemsDateDisplay) {
             console.error("Log meal modal elements not found!");
             return;
        }
        logMealForm.reset(); 
        logMealValidationError.style.display = 'none'; 
        logMealTypeSelect.value = mealType; 
        logMealTitleDateSpan.textContent = moment(dateStr).format('MMMM D, YYYY'); 
        logMealDateHiddenInput.value = dateStr; 
        loggedItemsDateDisplay.textContent = moment(dateStr).format('MMM D'); 

        // Populate logged items list for the selected date
        populateLoggedItemsList(dateStr);

        logMealModal.classList.add('active');
        body.classList.add('modal-open'); 
    }

    function closeLogMealModal() {
        if (!logMealModal) return;
        logMealModal.classList.remove('active');
        body.classList.remove('modal-open');
    }

     function populateLoggedItemsList(dateStr) {
        if (!loggedItemsList) return;
        const items = dailyFoodLog[dateStr] || [];
        loggedItemsList.innerHTML = ''; 

        if (items.length === 0) {
            loggedItemsList.innerHTML = '<li class="no-items-logged">No items logged yet for this date.</li>';
        } else {
            items.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="item-name">${escapeHTML(item.name)} (${item.meal})</span>
                    <span class="item-details">${item.calories}kcal, P:${item.protein || 0}g, C:${item.carbs || 0}g, F:${item.fat || 0}g</span>
                    <!-- Add delete button if needed -->
                `;
                loggedItemsList.appendChild(li);
            });
        }
    }

    function handleAddFoodClick(event) {
        const button = event.target.closest('.add-food-btn');
        if (!button) return;
        const mealType = button.dataset.mealType;
        if (!mealType) return;
        openLogMealModal(mealType, selectedDate); 
    }

    // Handle Modal Form Submission
    if (logMealForm) {
        logMealForm.addEventListener('submit', (event) => {
            event.preventDefault(); 
            logMealValidationError.style.display = 'none'; 

            // Get form data
            const formData = new FormData(logMealForm);
            const mealType = formData.get('mealType');
            const foodName = formData.get('foodName')?.trim();
            const calories = parseFloat(formData.get('calories'));
            const protein = parseFloat(formData.get('protein') || 0); 
            const carbs = parseFloat(formData.get('carbs') || 0);
            const fat = parseFloat(formData.get('fat') || 0);
            const logDate = formData.get('logDate'); 

            // Basic Validation
            if (!mealType || !foodName || isNaN(calories) || calories < 0) {
                logMealValidationError.textContent = 'Please fill in Meal Type, Food Name, and valid Calories.';
                logMealValidationError.style.display = 'block';
                return;
            }
             if (isNaN(protein) || protein < 0 || isNaN(carbs) || carbs < 0 || isNaN(fat) || fat < 0) {
                 logMealValidationError.textContent = 'Please enter valid non-negative numbers for macros.';
                 logMealValidationError.style.display = 'block';
                 return;
             }

            // --- Add data to the log ---
            const newItem = {
                id: Date.now(),
                meal: mealType,
                name: foodName,
                calories: calories,
                protein: protein,
                carbs: carbs,
                fat: fat
             
            };

            if (!dailyFoodLog[logDate]) {
                dailyFoodLog[logDate] = [];
            }
            dailyFoodLog[logDate].push(newItem);

            console.log("Logged Item:", newItem);
            console.log("Daily Log:", dailyFoodLog);


            // Update main display for the currently selected date
             if (logDate === selectedDate) {
                loadAndDisplayDataForDate(selectedDate);
             }

            // Update the list within the modal
             populateLoggedItemsList(logDate);

            // Clear the form for the next entry (optional: keep modal open?)
            logMealForm.reset();
             // Set meal type back to the initially selected one if needed, or default
             logMealTypeSelect.value = mealType;

        });
    }

    // Add event listeners for modal close buttons
    if (logMealCancelButton) logMealCancelButton.addEventListener('click', closeLogMealModal);
    if (logMealCloseButton) logMealCloseButton.addEventListener('click', closeLogMealModal);
    // Close modal if clicking outside the content area
    if (logMealModal) {
        logMealModal.addEventListener('click', (event) => {
            if (event.target === logMealModal) { // Check if click is on the overlay itself
                closeLogMealModal();
            }
        });
    }

    // Attach event listeners for edit/add using delegation
    const nutritionContentContainer = document.getElementById('tabs-3');
    if (nutritionContentContainer) {
        nutritionContentContainer.addEventListener('click', handleEditClick);
        nutritionContentContainer.addEventListener('click', handleAddFoodClick);
    }

    // Initial load for the default selected date
    loadAndDisplayDataForDate(selectedDate);


    // --- Workout Log Activity Planner Logic ---
    const activityPlannerSection = document.getElementById('tabs-1');
    if (activityPlannerSection) {
        const activityDaySelect = activityPlannerSection.querySelector('#activity-day');
        const activityTypeSelect = activityPlannerSection.querySelector('#activity-type');
        const activityDescriptionInput = activityPlannerSection.querySelector('#activity-description');
        const addActivityBtn = activityPlannerSection.querySelector('#add-activity-btn');
        const weeklyPlanDisplay = activityPlannerSection.querySelector('#weekly-plan-display');
        // Load/Save weekly plan data (e.g., using localStorage)
        let weeklyPlan = JSON.parse(localStorage.getItem('weeklyPlan')) || {
             Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
        };

        function escapeHTML(str) {
            const div = document.createElement('div');
            div.appendChild(document.createTextNode(str || ''));
            return div.innerHTML;
        }
        function renderWeeklyPlan() {
             if (!weeklyPlanDisplay) return;
            weeklyPlanDisplay.querySelectorAll('ul[data-day]').forEach(ul => ul.innerHTML = '');
            for (const day in weeklyPlan) {
                const dayList = weeklyPlanDisplay.querySelector(`ul[data-day="${day}"]`);
                if (dayList && weeklyPlan[day].length > 0) {
                    weeklyPlan[day].forEach(activity => {
                        const li = document.createElement('li');
                        li.innerHTML = `<span><strong>${escapeHTML(activity.type)}:</strong> ${escapeHTML(activity.description)}</span><button class="delete-btn activity-delete-btn" data-day="${day}" data-id="${activity.id}" aria-label="Delete activity: ${escapeHTML(activity.description)}">Delete</button>`;
                        dayList.appendChild(li);
                    });
                }
            }
        }
        function addActivity() {
            if (!activityDaySelect || !activityTypeSelect || !activityDescriptionInput) return;
            const day = activityDaySelect.value;
            const type = activityTypeSelect.value;
            const description = activityDescriptionInput.value.trim();
            if (!day || !type || !description) { alert('Please fill in all activity details.'); return; }
            if (weeklyPlan[day]) {
                weeklyPlan[day].push({ id: Date.now(), type, description });
                activityDescriptionInput.value = '';
                renderWeeklyPlan();
                localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan)); 
            }
        }
        function deleteActivity(day, id) {
            if (weeklyPlan[day]) {
                 const numericId = Number(id);
                 const initialLength = weeklyPlan[day].length;
                 weeklyPlan[day] = weeklyPlan[day].filter(activity => activity.id !== numericId);
                 if (weeklyPlan[day].length < initialLength) {
                    renderWeeklyPlan();
                    localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan)); 
                 }
             }
        }
        if (addActivityBtn) addActivityBtn.addEventListener('click', addActivity);
        if (activityDescriptionInput) activityDescriptionInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); addActivity(); } });
        if (weeklyPlanDisplay) weeklyPlanDisplay.addEventListener('click', (e) => { if (e.target.classList.contains('activity-delete-btn')) { const day = e.target.dataset.day; const id = e.target.dataset.id; if (day && id) deleteActivity(day, id); } });
        renderWeeklyPlan(); 
    }

}); 