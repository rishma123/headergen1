define(["base/js/namespace", "base/js/events"], function (Jupyter, events) {
  // Constants for class names and IDs
  const SIDEBAR_CLASS = "sidebar";
  const SIDEBAR_CLOSED_CLASS = "sidebar-closed";
  const SIDEBAR_OPEN_CLASS = "sidebar-open";
  const TOGGLE_BUTTON_ID = "toggle-all-headers";
  const SIDEBAR_TOGGLE_BUTTON_ID = "toggle-sidebar";
  const HEADERGEN_BUTTON_ID = "headergen-button";
  const SPINNER_ID = "headergen-spinner";

  /**
   * Displays a spinner overlay on the screen.
   */
  const showSpinner = () => {
    let spinner = document.getElementById(SPINNER_ID);
    if (!spinner) {
      spinner = document.createElement("div");
      spinner.id = SPINNER_ID;
      spinner.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            `;

      const spinnerIcon = document.createElement("div");
      spinnerIcon.style.cssText = `
                border: 8px solid #f3f3f3;
                border-top: 8px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
            `;

      spinner.appendChild(spinnerIcon);
      document.body.appendChild(spinner);

      // Add spinner animation styles
      const style = document.createElement("style");
      style.type = "text/css";
      style.innerHTML = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
      document.head.appendChild(style);
    }

    spinner.style.display = "flex";
  };

  /**
   * Hides the spinner overlay.
   */
  const hideSpinner = () => {
    const spinner = document.getElementById(SPINNER_ID);
    if (spinner) {
      spinner.style.display = "none";
    }
  };

  /**
   * Toggles the visibility of an element by its ID.
   * @param {string} id - The ID of the element to toggle.
   */
  window.toggleVisibility = (id) => {
    const elem = document.getElementById(id);
    const backToHeaderLink = elem?.nextElementSibling?.nextElementSibling;

    if (elem) {
      const isVisible = elem.style.display === "block";
      elem.style.display = isVisible ? "none" : "block";

      if (isVisible) {
        elem.classList.remove("visible");
        if (backToHeaderLink) backToHeaderLink.style.display = "none";
      } else {
        elem.classList.add("visible");
        if (backToHeaderLink) backToHeaderLink.style.display = "inline-block";
      }
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
      sidebar = document.createElement("div");
      sidebar.className = `${SIDEBAR_CLASS} ${SIDEBAR_CLOSED_CLASS}`; // Initially closed
      document.body.appendChild(sidebar);
    }
    return sidebar;
  };

  /**
   * Creates and appends the style element for custom styles.
   */
  const createStyleElement = () => {
    let styleElement = document.getElementById("ml-headergen-style");
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "ml-headergen-style";
      styleElement.innerHTML = `
                .ml-phase-container { display:block; transform: translateX(104px); margin-bottom:12px; }
                .ml-phase-header { font-weight: bold; font-size: medium; margin: 0; padding: 0; display: block; }
                .view-function-calls { margin-bottom: 10px; margin-left: 0; padding-left: 0; text-decoration: underline; cursor: pointer; }
                .function-details { color: black; white-space: pre-line; font-family: monospace; margin-top: 5px; position: relative; right: 26px;}
                .nested-list { list-style-type: disc; margin-left: 20px; white-space: nowrap; }
                .nested-list-1 { list-style-type: square; margin-left: 3px; white-space: nowrap; }
                .library-link, .function-link { color: black; text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 16px; }
                .sidebar { position: fixed; left: 0; top: 133px; width: 300px; height: calc(100% - 50px); background-color: #f4f4f4; color: #333; border-right: 1px solid #ccc; padding: 20px; overflow-y: auto; z-index: 1000; font-family: Arial, sans-serif; transition: transform 0.3s ease; }
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
                .back-to-header { display: none; color: #b05627; text-decoration: underline; font-size: 14px; margin-top: 5px; font-weight: bold; }
                .back-to-header:hover { text-decoration: underline; }
                .function-details.visible + .back-to-header { display: inline-block; }
                .highlighted-heading { font-size: 18px; font-weight: bold; color: #007bff; margin-bottom: 5px; }
                .details-summary { display: flex; align-items: center; cursor: pointer; font-size: 14px; font-weight: bold; background-color: #f5f5f5; border: 1px solid #ccc; border-radius: 4px; padding: 8px; margin-bottom: 5px; transition: background-color 0.3s ease; } .details-summary:hover { background-color: #e0e0e0; } .details-summary .chevron { width: 16px; height: 16px; margin-right: 8px; display: inline-block; font-size: 16px; text-align: center; line-height: 16px; color: #007bff; font-weight: bold; transition: transform 0.3s ease; } .details-summary.open .chevron { transform: rotate(90deg); } .sidebar .library-link, .sidebar .function-link { font-size: 12px; cursor: pointer; text-decoration: none; color: black; } .details-summary .library-link, .details-summary .function-link { text-decoration: underline; }
                .details-content { margin-left: 20px; padding: 10px; background-color: #fafafa; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1); display: none; } .cell-separator { border-top: 2px solid #ddd; margin: 10px 0; } 
                .cell-highlight { background-color: #f9f9f9; padding: 10px; border: 1px solid #ccc; border-radius: 4px; } 
                .expand-icon { width: 10px; height: 10px; display: inline-block; margin-right: 8px; background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23007bff" d="M12 16l-6-6h12z"/%3E%3C/svg%3E'); background-size: contain; background-repeat: no-repeat; } 
                .collapse-icon { width: 10px; height: 10px; display: inline-block; margin-right: 8px; background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23007bff" d="M12 8l6 6H6z"/%3E%3C/svg%3E'); background-size: contain; background-repeat: no-repeat; }
                .sidebar .library-link, .sidebar .function-link { font-size: 12px; cursor: pointer; text-decoration: none; color: black; } .details-summary .library-link, .details-summary .function-link { text-decoration: underline; }
                .cell-container { border: 1px solid #ccc; padding: 10px; margin-bottom: 5px; border-radius: 4px; background-color: #f9f9f9; } .cell-container:hover { box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); }
            `;
      document.head.appendChild(styleElement);
    } else {
    }
  };

  /**
   * Initializes the sidebar with the given phase to index mapping.
   * @param {Object} phaseToIndexMapping - The mapping of phases to cell indices.
   */
  const initializeSidebar = (phaseToIndexMapping, cellMapping) => {
    const sidebar = getOrCreateSidebar();
    const sidebarContent = document.createElement("div");
    sidebarContent.className = "sidebar-content";
    sidebar.innerHTML = "";
    sidebar.appendChild(sidebarContent);

    const sidebarHeader = document.createElement("div");
    sidebarHeader.className = "sidebar-header";
    sidebarContent.appendChild(sidebarHeader);

    const sidebarTitle = document.createElement("h3");
    sidebarTitle.innerText = "Index of ML Operations";
    sidebarHeader.appendChild(sidebarTitle);

    const sidebarList = document.createElement("ul");
    sidebarContent.appendChild(sidebarList);

    for (const phase in phaseToIndexMapping) {
      const indexList = phaseToIndexMapping[phase];
      const phaseItem = document.createElement("li");
      const phaseHeader = document.createElement("div");
      phaseHeader.className = "collapsible-header";
      phaseHeader.innerHTML = `<strong>${phase}</strong><span class="chevron down">▼</span>`;
      phaseHeader.onclick = function () {
        const content = this.nextElementSibling;
        const chevron = this.querySelector(".chevron");
        content.style.display =
          content.style.display === "none" ? "block" : "none";
        chevron.classList.toggle("down");
        chevron.classList.toggle("up");
      };
      phaseItem.appendChild(phaseHeader);

      const cellList = document.createElement("ul");
      cellList.className = "collapsible-content";
      cellList.style.display = "none";

      indexList.forEach((index) => {
        const cellId = index;
        const cellContainer = document.createElement("li");
        cellContainer.className = "cell-container"; // Container for both Go to Cell and View Function Calls

        // Go to Cell link
        const cellLink = document.createElement("a");
        cellLink.href = `#ml-header-${cellId}`;
        cellLink.innerText = `Go to Cell ${cellId}`;
        cellContainer.appendChild(cellLink);

        const cellData = cellMapping[cellId];
        if (
          cellData &&
          cellData.functions &&
          Object.keys(cellData.functions).length > 0
        ) {
          const viewFunctionsItem = document.createElement("div");

          // Create a <details> element to make "View Function Calls" collapsible
          const viewFunctionsDetails = document.createElement("details");
          const viewFunctionsSummary = document.createElement("summary");

          // Create a chevron for the "View Function Calls" section
          const chevronIcon = document.createElement("span");
          chevronIcon.className = "chevron right"; // Chevron initially pointing right
          chevronIcon.innerText = "►"; // Arrow pointing right

          const functionCount = Object.keys(cellData.functions).length;
          const functionText = functionCount === 1 ? "function" : "functions"; // Singular or plural based on count
          viewFunctionsSummary.innerText = `View Function Calls (${functionCount} ${functionText})`;
          viewFunctionsSummary.className = "details-summary";

          // Add the chevron icon before the text
          viewFunctionsSummary.prepend(chevronIcon);

          // Attach the summary to the details
          viewFunctionsDetails.appendChild(viewFunctionsSummary);

          // Initially keep librariesList hidden
          const librariesList = document.createElement("ul");
          librariesList.className = "nested-list";
          librariesList.style.display = "none"; // Closed by default

          const libraries = {};
          for (const func in cellData.functions) {
            const libraryName = func.split(".")[0];
            if (!libraries[libraryName]) {
              libraries[libraryName] = [];
            }
            libraries[libraryName].push(func);
          }

          // Iterate through libraries and functions
          for (const library in libraries) {
            const libraryItem = document.createElement("li");

            // Removed the library link (no longer making the library name a link)
            libraryItem.innerText = library; // Just set the library name as text

            // List of functions inside this library
            libraries[library].forEach((func) => {
              const functionItem = document.createElement("li");
              const functionLink = document.createElement("span");
              functionLink.className = "function-link";
              functionLink.innerText = func;

              functionItem.appendChild(functionLink);
              libraryItem.appendChild(functionItem);
            });

            librariesList.appendChild(libraryItem);
          }

          // Append the libraries list to the details block
          viewFunctionsDetails.appendChild(librariesList);
          viewFunctionsItem.appendChild(viewFunctionsDetails);
          cellContainer.appendChild(viewFunctionsItem);

          // Toggle the chevron icon direction on click
          viewFunctionsSummary.onclick = function () {
            const isOpen = viewFunctionsDetails.open;
            chevronIcon.innerText = isOpen ? "►" : "▼"; // Toggle between right and down chevrons
            librariesList.style.display = isOpen ? "none" : "block"; // Toggle visibility of content
          };
        }

        // Append the cell container to the list
        cellList.appendChild(cellContainer);
      });

      phaseItem.appendChild(cellList);
      sidebarList.appendChild(phaseItem);
    }
  };

  /**
   * Applies the linted content to the notebook.
   * @param {Object} analysisData - The analysis data containing cell mappings.
   */
  const applyLintedContent = (analysisData) => {
    const cellMapping = analysisData?.cell_mapping || {};
    const cells = Jupyter.notebook.get_cells();

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

    initializeSidebar(phaseToIndexMapping, cellMapping);

    createStyleElement();

    cells.forEach((cell, i) => {
      const cellData = cellMapping[i + 1];

      if (!cellData) {
        return;
      }

      const mlPhases = cellData.ml_phase || [];
      const functions = cellData.functions || {};
      const cellElement = cell.element[0];
      const existingHeader = cellElement.querySelector(".ml-phase-container");
      const existingFunctionDetails =
        cellElement.querySelector(".function-details");

      if (existingHeader) {
        const phaseHeader = existingHeader.querySelector(".ml-phase-header");
        if (phaseHeader) {
          phaseHeader.innerText = `${mlPhases.join(" | ")}`;
        }
      } else {
        const headerElement = document.createElement("div");
        headerElement.id = `ml-header-${i + 1}`;
        headerElement.className = "ml-phase-container";
        const phaseHeader = document.createElement("div");
        phaseHeader.className = "ml-phase-header";
        phaseHeader.innerText = `${mlPhases.join(" | ")}`;
        headerElement.appendChild(phaseHeader);
        cellElement.prepend(headerElement);
      }

      if (Object.keys(functions).length > 0) {
        let viewLink = cellElement.querySelector(".view-function-calls");
        if (!viewLink) {
          viewLink = document.createElement("span");
          viewLink.className = "view-function-calls";
          viewLink.innerText = "View Function Calls";
          viewLink.onclick = function () {
            const detailsDiv = document.getElementById(`funcs-${i + 1}`);
            detailsDiv.style.display =
              detailsDiv.style.display === "none" ? "block" : "none";
          };
          cellElement
            .querySelector(".ml-phase-container")
            .appendChild(viewLink);
        }

        let detailsDiv = existingFunctionDetails;
        if (!detailsDiv) {
          detailsDiv = document.createElement("div");
          detailsDiv.id = `funcs-${i + 1}`;
          detailsDiv.className = "function-details";
          detailsDiv.style.display = "block"; // Open by default
          cellElement
            .querySelector(".ml-phase-container")
            .appendChild(detailsDiv);
        }

        let libraryListHTML = `<ul class="nested-list" style="display:block;">`; // Open by default
        const libraries = {};
        Object.keys(functions).forEach((func) => {
          const libraryName = func.split(".")[0];
          if (!libraries[libraryName]) {
            libraries[libraryName] = [];
          }
          libraries[libraryName].push(func);
        });

        Object.keys(libraries).forEach((library) => {
          const libId = `lib-${i + 1}-${library}`;

          libraryListHTML += `
                    <li>
                        <span class="library-link" onclick="toggleVisibility('${libId}')">${library}</span>
                        <ul id="${libId}" class="nested-list-1" style="display:block;"> 
                    `;
          libraries[library].forEach((func) => {
            const funcId = `func-${i + 1}-${func}`;
            const highlightedContent = highlightHeadings(functions[func] || "");
            libraryListHTML += `
                            <li>
                                <span class="function-link" onclick="toggleVisibility('${funcId}')">${func}</span>
                                <div id="${funcId}" class="function-details" style="display:none;"> 
                                    ${highlightedContent}
                                </div>
                                <br>
                               <a href="#ml-header-${
                                 i + 1
                               }" class="back-to-header">back to header</a>
                            </li>
                        `;
          });
          libraryListHTML += "</ul></li>";
        });
        libraryListHTML += "</ul>";

        detailsDiv.innerHTML = libraryListHTML;
      } else {
        let viewLink = cellElement.querySelector(".view-function-calls");
        if (viewLink) {
          viewLink.remove();
        }
        let detailsDiv = cellElement.querySelector(".function-details");
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
    const headergenButton = document.getElementById(HEADERGEN_BUTTON_ID);
    if (headergenButton) {
      headergenButton.disabled = true; // Disable the button
    }
    showSpinner(); // Show spinner
    try {
      const filePath = Jupyter.notebook.notebook_path;
      const notebookContent = Jupyter.notebook.toJSON();
      const notebookBlob = new Blob([JSON.stringify(notebookContent)], {
        type: "application/json",
      });
      const formData = new FormData();
      formData.append("file", new File([notebookBlob], filePath));

      const fixedServerUrl = "http://localhost:8000";

      const response = await fetch(`${fixedServerUrl}/get_analysis_notebook/`, {
        method: "POST",
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
      const sidebarToggleButton = document.getElementById(
        SIDEBAR_TOGGLE_BUTTON_ID
      );
      if (sidebarToggleButton) {
        sidebarToggleButton.style.display = "inline-block";
      }
    } catch (error) {
    } finally {
      hideSpinner(); // Hide spinner
      if (headergenButton) {
        headergenButton.disabled = false; // Enable the button
      }
    }
  };

  /**
   * Adds the Headergen button to the toolbar.
   */
  const addHeadergenButton = () => {
    const toolbarContainer = document.querySelector(".container.toolbar");
    if (!toolbarContainer) {
      return;
    }

    // Create and style the "Run Headergen" button
    const headergenButton = document.createElement("button");
    headergenButton.innerHTML = "Run Headergen";
    headergenButton.id = HEADERGEN_BUTTON_ID;
    headergenButton.className = "btn btn-primary"; // Primary style for emphasis
    headergenButton.style.cssText = `
            margin: 5px;
            padding: 8px 15px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
        `;
    headergenButton.onmouseover = () => {
      headergenButton.style.backgroundColor = "#0056b3";
    };
    headergenButton.onmouseout = () => {
      headergenButton.style.backgroundColor = "#007bff";
    };
    headergenButton.onclick = async () => {
      headergenButton.disabled = true; // Disable button during operation
      headergenButton.style.opacity = 0.6;
      headergenButton.style.cursor = "not-allowed";

      await runHeadergen();

      headergenButton.disabled = false; // Re-enable button
      headergenButton.style.opacity = 1;
      headergenButton.style.cursor = "pointer";

      const toggleButton = document.getElementById(TOGGLE_BUTTON_ID);
      if (toggleButton) {
        toggleButton.style.display = "inline-block";
      }
    };
    toolbarContainer.appendChild(headergenButton);

    // Create and style the "Toggle Headers" button
    const toggleButton = document.createElement("button");
    toggleButton.id = TOGGLE_BUTTON_ID;
    toggleButton.innerHTML = "Hide Headers";
    toggleButton.className = "btn btn-secondary"; // Secondary style for differentiation
    toggleButton.style.cssText = `
            margin: 5px;
            padding: 8px 15px;
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            display: none; /* Initially hidden */
        `;
    toggleButton.onmouseover = () => {
      toggleButton.style.backgroundColor = "#5a6268";
    };
    toggleButton.onmouseout = () => {
      toggleButton.style.backgroundColor = "#6c757d";
    };
    // Set initial state to match headers' visibility
    let headersVisible = true;

    toggleButton.onclick = () => {
      const headers = document.querySelectorAll(".ml-phase-container");

      // Toggle visibility state
      headersVisible = !headersVisible;

      headers.forEach((header) => {
        header.style.display = headersVisible ? "block" : "none";
      });

      // Update button text based on visibility state
      toggleButton.innerHTML = headersVisible ? "Hide Headers" : "Show Headers";
    };

    toolbarContainer.appendChild(toggleButton);

    // Create and style the "Toggle Sidebar" button
    const sidebarToggleButton = document.createElement("button");
    sidebarToggleButton.id = SIDEBAR_TOGGLE_BUTTON_ID;
    sidebarToggleButton.innerHTML = "Hide Sidebar";
    sidebarToggleButton.className = "btn btn-secondary"; // Secondary style for differentiation
    sidebarToggleButton.style.cssText = `
            margin: 5px;
            padding: 8px 15px;
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            display: none; /* Initially hidden */
        `;
    sidebarToggleButton.onmouseover = () => {
      sidebarToggleButton.style.backgroundColor = "#5a6268";
    };
    sidebarToggleButton.onmouseout = () => {
      sidebarToggleButton.style.backgroundColor = "#6c757d";
    };
    sidebarToggleButton.onclick = () => {
      const sidebar = getOrCreateSidebar();
      sidebar.classList.toggle(SIDEBAR_CLOSED_CLASS);
      sidebar.classList.toggle(SIDEBAR_OPEN_CLASS);

      // Update button text based on sidebar state
      sidebarToggleButton.innerHTML = sidebar.classList.contains(
        SIDEBAR_CLOSED_CLASS
      )
        ? "Show Sidebar"
        : "Hide Sidebar";
    };
    toolbarContainer.appendChild(sidebarToggleButton);
  };

  /**
   * Loads the IPython extension.
   */
  const load_ipython_extension = () => {
    addHeadergenButton();
  };

  return {
    load_ipython_extension: load_ipython_extension,
  };
});
