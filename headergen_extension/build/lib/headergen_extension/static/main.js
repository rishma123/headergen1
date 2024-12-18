define(['base/js/namespace', 'base/js/events'], function (Jupyter, events) {

    // Constants for class names and IDs
    const SIDEBAR_CLASS = 'sidebar';
    const SIDEBAR_CLOSED_CLASS = 'sidebar-closed';
    const SIDEBAR_OPEN_CLASS = 'sidebar-open';
    const TOGGLE_BUTTON_ID = 'toggle-all-headers';
    const SIDEBAR_TOGGLE_BUTTON_ID = 'toggle-sidebar';
    const HEADERGEN_BUTTON_ID = 'headergen-button';

    /**
     * Toggles the visibility of an element by its ID.
     * @param {string} id - The ID of the element to toggle.
     */
    window.toggleVisibility = (id) => {
        const elem = document.getElementById(id);
        const backToHeaderLink = elem?.nextElementSibling?.nextElementSibling;

        if (elem) {
            const isVisible = elem.style.display === 'block';
            elem.style.display = isVisible ? 'none' : 'block';

            if (isVisible) {
                elem.classList.remove('visible');
                if (backToHeaderLink) backToHeaderLink.style.display = 'none';
            } else {
                elem.classList.add('visible');
                if (backToHeaderLink) backToHeaderLink.style.display = 'inline-block';
            }
        } else {
            console.warn(`Element with ID ${id} not found`);
        }
    };

    /**
     * Highlights headings in the given text.
     * @param {string} text - The text to highlight headings in.
     * @returns {string} - The text with highlighted headings.
     */
    const highlightHeadings = (text) => {
        const pattern = /(^|\n)([^\n]+?)\n-{2,}/g;
        return text.replace(pattern, (match, prefix, heading) => {
            return `${prefix}<span class="highlighted-heading">${heading}</span>\n`;
        });
    };

    /**
     * Gets or creates the sidebar element.
     * @returns {HTMLElement} - The sidebar element.
     */
    const getOrCreateSidebar = () => {
        let sidebar = document.querySelector(`.${SIDEBAR_CLASS}`);
        if (!sidebar) {
            sidebar = document.createElement('div');
            sidebar.className = `${SIDEBAR_CLASS} ${SIDEBAR_CLOSED_CLASS}`; // Initially closed
            document.body.appendChild(sidebar);
        }
        return sidebar;
    };

    /**
     * Creates and appends the style element for custom styles.
     */
    const createStyleElement = () => {
        let styleElement = document.getElementById('ml-headergen-style');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'ml-headergen-style';
            styleElement.innerHTML = `
                .ml-phase-container { display:block; transform: translateX(104px); margin-bottom:12px; }
                .ml-phase-header { font-weight: bold; font-size: medium; margin: 0; padding: 0; display: block; }
                .view-function-calls { margin-bottom: 10px; margin-left: 0; padding-left: 0; text-decoration: underline; cursor: pointer; }
                .function-details { display: none; color: black; margin-left: 0; padding-left: 0; white-space: pre-line; font-family: monospace; border-left: 4px solid #ccc; padding-left: 15px; margin-top: 5px; position: relative; }
                .nested-list { list-style-type: disc; margin-left: 20px; white-space: nowrap; }
                .nested-list-1 { list-style-type: square; margin-left: 20px; white-space: nowrap; }
                .library-link, .function-link { color: black; text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 16px; }
                .sidebar { position: fixed; left: 0; top: 122px; width: 300px; height: calc(100% - 50px); background-color: #f4f4f4; color: #333; border-right: 1px solid #ccc; padding: 20px; overflow-y: auto; z-index: 1000; font-family: Arial, sans-serif; transition: transform 0.3s ease; }
                .sidebar-closed { transform: translateX(-100%); }
                .sidebar-open { transform: translateX(0); }
                .sidebar h2 { font-size: 20px; margin-top: 0; }
                .sidebar h3 { font-size: 19px; font-weight: bold; color: #007bff; margin-bottom: 10px; }
                .sidebar ul { list-style-type: none; padding-left: 0; }
                .sidebar ul li { margin-bottom: 10px; }
                .sidebar ul li a { color: #007bff; text-decoration: none; }
                .sidebar ul li a:hover { text-decoration: underline; }
                .collapsible-header { cursor: pointer; padding: 10px; background-color: #e9ecef; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; }
                .collapsible-header .chevron { transition: transform 0.3s ease; }
                .collapsible-header .chevron.down { transform: rotate(0deg); }
                .collapsible-header .chevron.up { transform: rotate(180deg); }
                .collapsible-content { padding-left: 20px; }
                #notebook-container { margin-left: 320px; transition: margin-left 0.3s ease; }
                .sidebar-closed + #notebook-container { margin-left: 20px; }
                .back-to-header { display: none; color: #007bff; text-decoration: underline; font-size: 16px; margin-top: 5px; font-weight: bold; }
                .back-to-header:hover { text-decoration: underline; }
                .function-details.visible + .back-to-header { display: inline-block; }
                .highlighted-heading { font-size: 18px; font-weight: bold; color: #007bff; margin-bottom: 5px; }
            `;
            document.head.appendChild(styleElement);
            console.log("Added style element");
        } else {
            console.log("Style element already exists");
        }
    };

    /**
     * Initializes the sidebar with the given phase to index mapping.
     * @param {Object} phaseToIndexMapping - The mapping of phases to cell indices.
     */
    const initializeSidebar = (phaseToIndexMapping) => {
        const sidebar = getOrCreateSidebar();
        const sidebarContent = document.createElement('div');
        sidebarContent.className = 'sidebar-content';
        sidebar.innerHTML = '';
        sidebar.appendChild(sidebarContent);

        const sidebarHeader = document.createElement('div');
        sidebarHeader.className = 'sidebar-header';
        sidebarContent.appendChild(sidebarHeader);

        const sidebarTitle = document.createElement('h3');
        sidebarTitle.innerText = 'Index of ML Operations';
        sidebarHeader.appendChild(sidebarTitle);

        const sidebarList = document.createElement('ul');
        sidebarContent.appendChild(sidebarList);

        Object.keys(phaseToIndexMapping).forEach((phase) => {
            const indexList = phaseToIndexMapping[phase];
            const phaseItem = document.createElement('li');
            const phaseHeader = document.createElement('div');
            phaseHeader.className = 'collapsible-header';
            phaseHeader.innerHTML = `<strong>${phase}</strong><span class="chevron down">▼</span>`;
            phaseHeader.onclick = function () {
                const content = this.nextElementSibling;
                const chevron = this.querySelector('.chevron');
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
                chevron.classList.toggle('down');
                chevron.classList.toggle('up');
            };
            phaseItem.appendChild(phaseHeader);

            const cellList = document.createElement('ul');
            cellList.className = 'collapsible-content';
            cellList.style.display = 'none';
            indexList.forEach((index) => {
                const cellId = index;
                const cellLink = document.createElement('li');
                cellLink.innerHTML = `<a href="#ml-header-${cellId}"># Go to Cell ${cellId}</a>`;
                cellList.appendChild(cellLink);
            });
            phaseItem.appendChild(cellList);
            sidebarList.appendChild(phaseItem);
        });
    };

    /**
     * Applies the linted content to the notebook.
     * @param {Object} analysisData - The analysis data containing cell mappings.
     */
    const applyLintedContent = (analysisData) => {
        console.log("Applying linted content");
        const cellMapping = analysisData?.cell_mapping || {};
        console.log("Cell Mapping Data:", cellMapping);

        const cells = Jupyter.notebook.get_cells();
        console.log(`Total cells in notebook: ${cells.length}`);

        const phaseToIndexMapping = {};
        Object.keys(cellMapping).forEach((index) => {
            const cell = cellMapping[index];
            const mlPhase = cell.ml_phase;
            mlPhase.forEach((phase) => {
                if (!phaseToIndexMapping[phase]) {
                    phaseToIndexMapping[phase] = [];
                }
                phaseToIndexMapping[phase].push(index);
            });
        });

        initializeSidebar(phaseToIndexMapping);
        createStyleElement();

        console.log(`Processing ${cells.length} cells`);
        cells.forEach((cell, i) => {
            console.log(`Processing cell ${i + 1} of ${cells.length}`);
            const cellData = cellMapping[i + 1];

            if (!cellData) {
                console.warn(`No cell mapping data found for cell ${i + 1}`);
                return;
            }

            const mlPhases = cellData.ml_phase || [];
            const functions = cellData.functions || {};

            console.log(`mlPhases for cell ${i + 1}:`, mlPhases);
            console.log(`Functions for cell ${i + 1}:`, functions);

            const cellElement = cell.element[0];
            const existingHeader = cellElement.querySelector('.ml-phase-container');
            const existingFunctionDetails = cellElement.querySelector('.function-details');

            if (existingHeader) {
                console.log(`Header already exists for cell ${i + 1}`);
                const phaseHeader = existingHeader.querySelector('.ml-phase-header');
                if (phaseHeader) {
                    phaseHeader.innerText = `${mlPhases.join(' | ')}`;
                    console.log(`Updated header content for cell ${i + 1}`);
                }
            } else {
                const headerElement = document.createElement('div');
                headerElement.id = `ml-header-${i + 1}`;
                headerElement.className = 'ml-phase-container';
                const phaseHeader = document.createElement('div');
                phaseHeader.className = 'ml-phase-header';
                phaseHeader.innerText = `${mlPhases.join(' | ')}`;
                headerElement.appendChild(phaseHeader);
                cellElement.prepend(headerElement);
                console.log(`Added header for cell ${i + 1}`);
            }

            if (Object.keys(functions).length > 0) {
                console.log(`Adding or updating "View Function Calls" link for cell ${i + 1}`);
                let viewLink = cellElement.querySelector('.view-function-calls');
                if (!viewLink) {
                    viewLink = document.createElement('span');
                    viewLink.className = 'view-function-calls';
                    viewLink.innerText = 'View Function Calls';
                    viewLink.onclick = function () {
                        const detailsDiv = document.getElementById(`funcs-${i + 1}`);
                        detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
                    };
                    cellElement.querySelector('.ml-phase-container').appendChild(viewLink);
                }

                let detailsDiv = existingFunctionDetails;
                if (!detailsDiv) {
                    detailsDiv = document.createElement('div');
                    detailsDiv.id = `funcs-${i + 1}`;
                    detailsDiv.className = 'function-details';
                    detailsDiv.style.display = 'none';
                    cellElement.querySelector('.ml-phase-container').appendChild(detailsDiv);
                }

                let libraryListHTML = `<ul class="nested-list">`;
                const libraries = {};
                Object.keys(functions).forEach(func => {
                    const libraryName = func.split('.')[0];
                    if (!libraries[libraryName]) {
                        libraries[libraryName] = [];
                    }
                    libraries[libraryName].push(func);
                });

                Object.keys(libraries).forEach(library => {
                    const libId = `lib-${i + 1}-${library}`;

                    libraryListHTML += `
                    <li>
                        <span class="library-link" onclick="toggleVisibility('${libId}')">${library}</span>
                        <ul id="${libId}" class="nested-list-1" style="display:none;">
                `;
                    libraries[library].forEach(func => {
                        const funcId = `func-${i + 1}-${func}`;
                        const highlightedContent = highlightHeadings(functions[func] || "");
                        libraryListHTML += `
                            <li>
                                <span class="function-link" onclick="toggleVisibility('${funcId}')">${func}</span>
                                <div id="${funcId}" class="function-details" style="display:none;">
                                    ${highlightedContent}
                                </div>
                                <br>
                               <a href="#ml-header-${i + 1}" class="back-to-header">back to header</a>
                            </li>
                        `;
                    });
                    libraryListHTML += '</ul></li>';
                });
                libraryListHTML += '</ul>';

                detailsDiv.innerHTML = libraryListHTML;
            } else {
                let viewLink = cellElement.querySelector('.view-function-calls');
                if (viewLink) {
                    viewLink.remove();
                }
                let detailsDiv = cellElement.querySelector('.function-details');
                if (detailsDiv) {
                    detailsDiv.remove();
                }
            }
        });
    };

    /**
     * Runs the Headergen analysis.
     */
    const runHeadergen = async () => {
        console.log("Running Headergen Analysis");
        const headergenButton = document.getElementById(HEADERGEN_BUTTON_ID);
        if (headergenButton) {
            headergenButton.disabled = true; // Disable the button
        }
        try {
            const filePath = Jupyter.notebook.notebook_path;
            const notebookContent = Jupyter.notebook.toJSON();
            const notebookBlob = new Blob([JSON.stringify(notebookContent)], { type: 'application/json' });
            const formData = new FormData();
            formData.append('file', new File([notebookBlob], filePath));

            const fixedServerUrl = 'http://3di-1.cs.upb.de:8000';

            const response = await fetch(`${fixedServerUrl}/get_analysis_notebook/`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error fetching analysis: ${response.statusText}`);
            }

            const analysisData = await response.json();

            applyLintedContent(analysisData);

            const toggleButton = document.getElementById(TOGGLE_BUTTON_ID);
            if (toggleButton) {
                toggleButton.style.display = "inline-block";
            }

            // Open the sidebar after analysis is completed
            const sidebar = getOrCreateSidebar();
            sidebar.classList.remove(SIDEBAR_CLOSED_CLASS);
            sidebar.classList.add(SIDEBAR_OPEN_CLASS);

            // Show the sidebar toggle button
            const sidebarToggleButton = document.getElementById(SIDEBAR_TOGGLE_BUTTON_ID);
            if (sidebarToggleButton) {
                sidebarToggleButton.style.display = "inline-block";
            }

        } catch (error) {
            console.error('Error occurred:', error);
        } finally {
            if (headergenButton) {
                headergenButton.disabled = false; // Enable the button
            }
        }
    };

    /**
     * Adds the Headergen button to the toolbar.
     */
    const addHeadergenButton = () => {
        console.log("Adding Headergen button to toolbar");
        const toolbarContainer = document.querySelector(".container.toolbar");
        if (!toolbarContainer) {
            console.warn("Toolbar container not found");
            return;
        }

        const headergenButton = document.createElement("button");
        headergenButton.innerHTML = "Run Headergen Analysis";
        headergenButton.id = HEADERGEN_BUTTON_ID; 
        headergenButton.className = "btn btn-default";
        headergenButton.style.margin = "5px";
        headergenButton.onclick = async () => {
            await runHeadergen();
            const toggleButton = document.getElementById(TOGGLE_BUTTON_ID);
            if (toggleButton) {
                toggleButton.style.display = "inline-block";
            }
        };

        toolbarContainer.appendChild(headergenButton);
        console.log("Headergen button added to toolbar");

        const toggleButton = document.createElement("button");
        toggleButton.id = TOGGLE_BUTTON_ID;
        toggleButton.innerHTML = "Toggle Headers";
        toggleButton.className = "btn btn-default";
        toggleButton.style.margin = "5px";
        toggleButton.style.display = "none";
        toggleButton.onclick = () => {
            const headers = document.querySelectorAll('.ml-phase-container');
            headers.forEach(header => {
                header.style.display = header.style.display === 'none' ? 'block' : 'none';
            });
        };

        toolbarContainer.appendChild(toggleButton);
        console.log("Toggle button added to toolbar");

        // Add sidebar toggle button
        const sidebarToggleButton = document.createElement("button");
        sidebarToggleButton.id = SIDEBAR_TOGGLE_BUTTON_ID;
        sidebarToggleButton.innerHTML = "Toggle Sidebar";
        sidebarToggleButton.className = "btn btn-default";
        sidebarToggleButton.style.margin = "5px";
        sidebarToggleButton.style.display = "none"; // Initially hidden
        sidebarToggleButton.onclick = () => {
            const sidebar = getOrCreateSidebar();
            sidebar.classList.toggle(SIDEBAR_CLOSED_CLASS);
            sidebar.classList.toggle(SIDEBAR_OPEN_CLASS);
        };

        toolbarContainer.appendChild(sidebarToggleButton);
        console.log("Sidebar toggle button added to toolbar");
    };

    /**
     * Loads the IPython extension.
     */
    const load_ipython_extension = () => {
        console.log("Loading Headergen extension");
        addHeadergenButton();
    };

    return {
        load_ipython_extension: load_ipython_extension,
    };
});