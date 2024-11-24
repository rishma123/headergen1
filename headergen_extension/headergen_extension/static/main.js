define(['base/js/namespace', 'base/js/events'], function (Jupyter, events) {

    // Function to toggle the visibility of an element by its ID
    window.toggleVisibility = function (id) {
        const elem = document.getElementById(id);
        if (elem) {
            elem.style.display = elem.style.display === 'none' ? 'block' : 'none';
        } else {
            console.warn(`Element with ID ${id} not found`);
        }
    };

    // Function to create or get the sidebar
    const getOrCreateSidebar = function () {
        let sidebar = document.querySelector('.sidebar');
        if (!sidebar) {
            sidebar = document.createElement('div');
            sidebar.className = 'sidebar';
            document.body.appendChild(sidebar);
        }
        return sidebar;
    };

    // Function to apply linted content to the notebook cells
    const applyLintedContent = function (analysisData) {
        console.log("Applying linted content");
        const cellMapping = analysisData?.cell_mapping || {}; // Get cell mapping data from analysis
        console.log("Cell Mapping Data:", cellMapping);

        // Get the cells from the Jupyter notebook
        const cells = Jupyter.notebook.get_cells();
        console.log(`Total cells in notebook: ${cells.length}`);

        // Create a mapping of ml_phase to cell index
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

        // Get or create the sidebar
        const sidebar = getOrCreateSidebar();

        const sidebarContent = document.createElement('div');
        sidebarContent.className = 'sidebar-content';
        sidebar.innerHTML = ''; // Clear existing content
        sidebar.appendChild(sidebarContent);

        const sidebarHeader = document.createElement('div');
        sidebarHeader.className = 'sidebar-header';
        sidebarContent.appendChild(sidebarHeader);

        const sidebarTitle = document.createElement('h3');
        sidebarTitle.innerText = 'Index of ML Operations';
        sidebarHeader.appendChild(sidebarTitle);

        const sidebarList = document.createElement('ul');
        sidebarContent.appendChild(sidebarList);

        // Add jump links to each cell based on its id to corresponding phase
        Object.keys(phaseToIndexMapping).forEach((phase) => {
            const indexList = phaseToIndexMapping[phase];
            const phaseItem = document.createElement('li');
            const phaseHeader = document.createElement('div');
            phaseHeader.className = 'collapsible-header';
            phaseHeader.innerHTML = `<strong>${phase}</strong>`;
            phaseHeader.onclick = function () {
                const content = this.nextElementSibling;
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
            };
            phaseItem.appendChild(phaseHeader);

            const cellList = document.createElement('ul');
            cellList.className = 'collapsible-content';
            cellList.style.display = 'none'; // Initially hidden
            indexList.forEach((index) => {
                const cellId = index;
                const cellLink = document.createElement('li');
                cellLink.innerHTML = `<a href="#ml-header-${cellId}"># Go to Cell ${cellId}</a>`;
                cellList.appendChild(cellLink);
            });
            phaseItem.appendChild(cellList);
            sidebarList.appendChild(phaseItem);
        });

        // Check if style element already exists and add if not
        let styleElement = document.getElementById('ml-headergen-style');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'ml-headergen-style';
            styleElement.innerHTML = `
                .ml-phase-container {
                    display:block;
                    transform: translateX(104px);
               }

                .ml-phase-header {
                    font-weight: bold;
                    font-size: medium;
                    margin: 0;
                    padding: 0;
                    display: block;
                }

                .view-function-calls {
                    margin-bottom: 10px;
                    margin-left: 0;
                    padding-left: 0;
                }

                .function-details {
                    display: none;
                    color: black;
                    margin-left: 0;
                    padding-left: 0;
                    white-space: pre-line;
                    font-family: monospace;
                    border-left: 4px solid #ccc;
                    padding: 5px;
                    margin-top: 5px;
                }

                .nested-list {
                    list-style-type: disc;
                    margin-left: 20px;
                }

                .nested-list-1 {
                    list-style-type: square;
                    margin-left: 20px;
                }

                .back-to-header {
                    color: #007bff;
                    text-decoration: none;
                    font-size: 14px;
                    margin-top: 5px;
                }

                .back-to-header:hover {
                    text-decoration: underline;
                }

                .sidebar {
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 300px;
                    height: 100%;
                    background-color: #f4f4f4; 
                    color: #333; 
                    border-right: 1px solid #ccc;
                    padding: 20px; 
                    overflow-y: auto;
                    z-index: 1000; 
                    font-family: Arial, sans-serif; 
                    transition: transform 0.3s ease;
                }
                .sidebar-closed {
                    transform: translateX(-100%);
                }
                .sidebar h2 {
                    font-size: 20px; 
                    margin-top: 0;
                }
                .sidebar ul {
                    list-style-type: none;
                    padding-left: 0;
                }
                .sidebar ul li {
                    margin-bottom: 10px;
                }
                .sidebar ul li a {
                    color: #007bff; 
                    text-decoration: none;
                }
                .sidebar ul li a:hover {
                    text-decoration: underline;
                }
                .collapsible-header {
                    cursor: pointer;
                    padding: 10px;
                    background-color: #e9ecef;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    margin-bottom: 5px;
                }
                .collapsible-content {
                    padding-left: 20px;
                }
                #notebook-container {
                    margin-left: 320px;
                    transition: margin-left 0.3s ease;
                }
                .sidebar-closed + #notebook-container {
                    margin-left: 20px;
                }
                div.input_prompt {
                    display: table-cell;
                    vertical-align: middle;
                    padding-right: 10px;
                    color: red;
                }
                .input_area {
                    display: table-cell;
                    vertical-align: middle;
                }
                .cell {
                    display: table;
                    width: 100%;
                }
            `;
            document.head.appendChild(styleElement);
            console.log("Added style element");
        } else {    
            console.log("Style element already exists");
        }

        // Process each cell and add header if required
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

            // If header already exists, update the content
            if (existingHeader) {
                console.log(`Header already exists for cell ${i + 1}`);
                const phaseHeader = existingHeader.querySelector('.ml-phase-header');
                if (phaseHeader) {
                    phaseHeader.innerText = `${mlPhases.join(' | ')}`;
                    console.log(`Updated header content for cell ${i + 1}`);
                }
            } else {
                // If header doesn't exist, add a jump link to the cell based on its id            
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

            // Add or update "View Function Calls" link if functions exist
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
                        libraryListHTML += `
                            <li>
                                <span class="function-link" onclick="toggleVisibility('${funcId}')">${func}</span>
                                <div id="${funcId}" class="function-details" style="display:none;">
                                    ${functions[func]}
                                </div>
                                <br>
                                <a href="#ml-header-${i + 1}" class="back-to-header">Back to Header</a> <!-- Link to go back to header -->
                            </li>
                        `;
                    });
                    libraryListHTML += '</ul></li>';
                });
                libraryListHTML += '</ul>';

                detailsDiv.innerHTML = libraryListHTML;
            } else {
                // Remove "View Function Calls" link if no functions exist
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

    // Function to run the Headergen analysis
    const runHeadergen = async function () {
        console.log("Running Headergen Analysis");
        try {
            const filePath = Jupyter.notebook.notebook_path;
            const notebookContent = Jupyter.notebook.toJSON();
            const notebookBlob = new Blob([JSON.stringify(notebookContent)], { type: 'application/json' });
            const formData = new FormData();
            formData.append('file', new File([notebookBlob], filePath));

            const fixedServerUrl = 'http://localhost:8000';

            const response = await fetch(`${fixedServerUrl}/get_analysis_notebook/`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error fetching analysis: ${response.statusText}`);
            }

            const analysisData = await response.json();

            applyLintedContent(analysisData);

            // Enable the toggle button after running the analysis
            const toggleButton = document.getElementById('toggle-all-headers');
            if (toggleButton) {
                toggleButton.style.display = "inline-block"; // Show the toggle button
            }

        } catch (error) {
            console.error('Error occurred:', error);
        }
    };

    // Function to add the Headergen button to the toolbar
    const addHeadergenButton = function () {
        console.log("Adding Headergen button to toolbar");
        const toolbarContainer = document.querySelector(".container.toolbar");
        if (!toolbarContainer) {
            console.warn("Toolbar container not found");
            return;
        }

        const headergenButton = document.createElement("button");
        headergenButton.innerHTML = "Run Headergen Analysis";
        headergenButton.className = "btn btn-default";
        headergenButton.style.margin = "5px";
        headergenButton.onclick = async function () {
            await runHeadergen();
            const toggleButton = document.getElementById('toggle-all-headers');
            if (toggleButton) {
                toggleButton.style.display = "inline-block"; // Show the toggle button
            }
        };

        toolbarContainer.appendChild(headergenButton);
        console.log("Headergen button added to toolbar");

        // Create the toggle button
        const toggleButton = document.createElement("button");
        toggleButton.id = "toggle-all-headers";
        toggleButton.innerHTML = "Toggle ML Phase Headers";
        toggleButton.className = "btn btn-default";
        toggleButton.style.margin = "5px";
        toggleButton.style.display = "none"; // Initially hidden
        toggleButton.onclick = function () {
            const headers = document.querySelectorAll('.ml-phase-container');
            headers.forEach(header => {
                header.style.display = header.style.display === 'none' ? 'block' : 'none';
            });
        };

        toolbarContainer.appendChild(toggleButton);
        console.log("Toggle button added to toolbar");
    };

    // Function to load the IPython extension
    function load_ipython_extension() {
        console.log("Loading Headergen extension");
        addHeadergenButton();
    }

    return {
        load_ipython_extension: load_ipython_extension,
    };
});
