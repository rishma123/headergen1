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
      spinner.innerHTML = `
      <div style="border: 8px solid #f3f3f3; border-top: 8px solid #3498db; 
                  border-radius: 50%; width: 50px; height: 50px; 
                  animation: spin 1s linear infinite;"></div>
    `;
      spinner.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(255, 255, 255, 0.8); display: flex; align-items: center; 
      justify-content: center; z-index: 2000;
    `;
      document.body.appendChild(spinner);

      const style = document.createElement("style");
      style.textContent = `
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `;
      document.head.appendChild(style);
    }
    spinner.style.display = "flex";
  };

  /**
   * Hides the spinner overlay on the screen.
   */
  const hideSpinner = () => {
    const spinner = document.getElementById(SPINNER_ID);
    if (spinner) spinner.style.display = "none";
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
   * Toggles the visibility of an element containing function details by its ID.
   * @param {string} funcId - The ID of the element to toggle.
   */
  window.toggleFunctionDetails = (funcId) => {
    const funcDetails = document.getElementById(funcId);

    if (funcDetails) {
      const isVisible = funcDetails.style.display === "none";
      funcDetails.style.display = isVisible ? "block" : "none";

      // Ensure "Back to Header" link appears only if content is scrollable
      const backToHeaderLink = funcDetails.querySelector(".back-to-header");
      if (backToHeaderLink) {
        backToHeaderLink.style.display =
          isVisible && funcDetails.scrollHeight > funcDetails.offsetHeight
            ? "inline"
            : "none";
      }
    }
  };

  /**
   * Toggles the visibility of function arguments by its ID.
   * @param {string} id - The ID of the element to toggle.
   */
  window.toggleArgumentsVisibility = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display =
        element.style.display === "none" ? "block" : "none";
    }
  };

  /**
   * Gets or creates the sidebar element.
   * @returns {HTMLElement} - The sidebar element.
   */
  const getOrCreateSidebar = () => {
    let sidebar = document.querySelector(`.${SIDEBAR_CLASS}`);
    if (!sidebar) {
      sidebar = document.createElement("div");
      sidebar.className = `${SIDEBAR_CLASS} ${SIDEBAR_CLOSED_CLASS}`;
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
      styleElement.innerHTML = ` #notebook-container {transition: none; } 
        .ml-phase-container { display:block; transform: translateX(104px); margin-bottom:12px; }
        .ml-phase-header { font-weight: bold; margin: 0; padding: 0; display: block; }
        .view-function-calls { margin-bottom: 10px; margin-left: 0; padding-left: 0; text-decoration: underline; cursor: pointer; display: block; margin-top: 16px; }
        .function-details { color: black; white-space: pre-line; font-family: monospace; margin-top: 5px; position: relative; right: 26px;}
        .nested-list { list-style-type: disc; margin-left: 20px; white-space: nowrap; }
        .function-link { font-size: 18px;}
        .library-link, .function-link { color: black; text-decoration: underline; cursor: pointer; font-weight: 600;}
        .sidebar { position: fixed; left: 0; top: 133px; width: auto; max-width: 25%; min-width: 200px; height: calc(100% - 50px); background-color: #f4f4f4; color: #333; border-right: 1px solid #ccc; padding: 20px; overflow-y: auto; z-index: 1000; font-family: Arial, sans-serif; transition: transform 0.3s ease, width 0.3s ease; } 
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
        .sidebar-closed + #notebook-container { margin-left: 20px; }
        .back-to-header { display: none; color: #b05627; text-decoration: underline; font-size: 14px; margin-top: 5px; font-weight: bold; }
        .back-to-header:hover { text-decoration: underline; }
        .function-details.visible + .back-to-header { display: inline-block; }
        .highlighted-heading { font-size: 18px; font-weight: bold; color: #007bff; margin-bottom: 5px; }
        .details-summary { display: flex; align-items: center; cursor: pointer; font-size: 14px; font-weight: bold; background-color: #f5f5f5; border: 1px solid #ccc; border-radius: 4px; padding: 8px; margin-bottom: 5px; transition: background-color 0.3s ease; } .details-summary:hover { background-color: #e0e0e0; } .details-summary .chevron { width: 16px; height: 16px; margin-right: 8px; display: inline-block; font-size: 16px; text-align: center; line-height: 16px; color: #007bff; font-weight: bold; transition: transform 0.3s ease; } .details-summary.open .chevron { transform: rotate(90deg); } 
        .sidebar .library-link, .sidebar .function-link { font-size: 12px; cursor: pointer; text-decoration: none; color: black; word-wrap: break-word; text-overflow: ellipsis; overflow: hidden; white-space: normal; font-weight: normal} .details-summary .library-link, .details-summary .function-link { text-decoration: underline; }
        .details-content { margin-left: 20px; padding: 10px; background-color: #fafafa; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1); display: none; } .cell-separator { border-top: 2px solid #ddd; margin: 10px 0; } 
        .cell-highlight { background-color: #f9f9f9; padding: 10px; border: 1px solid #ccc; border-radius: 4px; } 
        .expand-icon { width: 10px; height: 10px; display: inline-block; margin-right: 8px; background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23007bff" d="M12 16l-6-6h12z"/%3E%3C/svg%3E'); background-size: contain; background-repeat: no-repeat; } 
        .collapse-icon { width: 10px; height: 10px; display: inline-block; margin-right: 8px; background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23007bff" d="M12 8l6 6H6z"/%3E%3C/svg%3E'); background-size: contain; background-repeat: no-repeat; }
        .cell-container { border: 1px solid #ccc; padding: 10px; margin-bottom: 5px; border-radius: 4px; background-color: #f9f9f9; } .cell-container:hover { box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); }
        .nested-list-1 ul { list-style-type: square !important; padding-left: 20px; max-width: 100%; white-space: normal; overflow-wrap: anywhere; word-break: break-word; font-size: 16px; }
        .nested-list-1 li { display: list-item; white-space: normal; overflow-wrap: anywhere; word-break: break-word; margin-bottom: 5px; font-size: 16px; } 
        .back-to-header { display: block !important; color: #be2506; text-decoration: underline; font-size: 14px; margin-top: 0px; margin-bottom: -60px; cursor: pointer; } .back-to-header:hover { color: #0056b3; }
        .args-label, .kwargs-label { font-size: 18px; font-weight: bold; display: block; margin-bottom: 5px; } 
        .args-content, .kwargs-content { font-size: 14px; overflow-wrap: anywhere; word-break: break-word; white-space: normal; display: block; max-width: 90%; max-height: 40px; transition: max-height 0.3s ease; margin-bottom: 5px; color: black; } 
        .nested-list-1 { list-style-type: decimal; margin-left: 20px; font-size: 14px; color: #007bff; overflow-wrap: anywhere; } 
        .nested-list-1 li { color: #007bff; } `;
      document.head.appendChild(styleElement);
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
        cellContainer.className = "cell-container";

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

          // Create a <details> element for "View Function Calls"
          const viewFunctionsDetails = document.createElement("details");
          const viewFunctionsSummary = document.createElement("summary");

          const chevronIcon = document.createElement("span");
          chevronIcon.className = "chevron right"; // Chevron initially pointing right
          chevronIcon.innerText = "►";

          const functionCount = Object.keys(cellData.functions).length;
          const functionText = functionCount === 1 ? "function" : "functions";
          viewFunctionsSummary.innerText = `View Function Calls (${functionCount} ${functionText})`;
          viewFunctionsSummary.className = "details-summary";
          viewFunctionsSummary.prepend(chevronIcon);
          viewFunctionsDetails.appendChild(viewFunctionsSummary);

          const librariesList = document.createElement("ul");
          librariesList.className = "nested-list";
          librariesList.style.display = "none"; // Hide by default

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

            // Make the library name bold
            const libraryName = document.createElement("strong");
            libraryName.innerText = library;
            libraryItem.appendChild(libraryName);

            // Create a list for functions inside this library with bullets
            const functionsList = document.createElement("ul");
            functionsList.style.listStyleType = "disc"; // This will add the bullet points

            libraries[library].forEach((func) => {
              const functionItem = document.createElement("li");
              const functionLink = document.createElement("span");
              functionLink.className = "function-link";
              functionLink.innerText = func;
              functionItem.appendChild(functionLink);
              functionsList.appendChild(functionItem);
            });

            libraryItem.appendChild(functionsList);
            librariesList.appendChild(libraryItem);
          }

          viewFunctionsDetails.appendChild(librariesList);
          viewFunctionsItem.appendChild(viewFunctionsDetails);
          cellContainer.appendChild(viewFunctionsItem);

          // Toggle the chevron icon direction on click
          viewFunctionsSummary.onclick = function () {
            const isOpen = viewFunctionsDetails.open;
            chevronIcon.innerText = isOpen ? "►" : "▼";
            librariesList.style.display = isOpen ? "none" : "block";
          };
        }

        cellList.appendChild(cellContainer);
      });

      phaseItem.appendChild(cellList);
      sidebarList.appendChild(phaseItem);
    }
  };

  /**
   * Applies linted content to the Jupyter notebook by updating the sidebar and
   * cell elements with machine learning phase headers and function details.
   *
   * @param {Object} analysisData - The analysis data containing mapping information.
   * @param {Object} analysisData.cell_mapping - A mapping of cell indices to cell data.
   *
   * The function processes each cell in the notebook, updates the sidebar with
   * machine learning phases, and appends function call details to the cell elements. It
   * creates or updates headers for machine learning phases using <h1> tags and manages
   * visibility toggles for function call details. The sidebar and cell elements are
   * styled and updated to reflect changes in the analysis data.
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

      // Update or create ML Phase Header
      if (existingHeader) {
        const phaseHeader = existingHeader.querySelector(".ml-phase-header");
        if (phaseHeader) {
          phaseHeader.outerHTML = `<h1 class="ml-phase-header">${mlPhases.join(
            " | "
          )}</h1>`;
        }
      } else {
        const headerElement = document.createElement("div");
        headerElement.id = `ml-header-${i + 1}`;
        headerElement.className = "ml-phase-container";
        const phaseHeader = document.createElement("h1");
        phaseHeader.className = "ml-phase-header";
        phaseHeader.innerText = `${mlPhases.join(" | ")}`;
        headerElement.appendChild(phaseHeader);
        cellElement.prepend(headerElement);
      }

      // Handling functions and their arguments
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

        let libraryListHTML = `<ul class="nested-list" style="display:block;">`; // Libraries open by default
        const libraries = {};

        // Group functions by library
        Object.keys(functions).forEach((func) => {
          const libraryName = func.split(".")[0];
          if (!libraries[libraryName]) {
            libraries[libraryName] = [];
          }
          libraries[libraryName].push(func);
        });

        // Generate library list
        Object.keys(libraries).forEach((library) => {
          const libId = `lib-${i + 1}-${library}`;

          libraryListHTML += `
    <li>
      <h2 class="library-link" onclick="toggleVisibility('${libId}')">${library}</h2>
      <ul id="${libId}" class="nested-list-1" style="display:none;"> <!-- Functions hidden initially -->
  `;

          // Show functions under the library (Initially hidden)
          libraries[library].forEach((func) => {
            const funcId = `func-${i + 1}-${func}`;
            const functionData = functions[func];
            const argumentsHTML = generateArgumentsHTML(functionData);
            const docstringHTML = generateDocstringHTML(functionData, i + 1);

            libraryListHTML += `
      <li>
        <span class="function-link" onclick="toggleFunctionDetails('${funcId}')">${func}</span>
        <div id="${funcId}" class="function-details" style="display:none;">
          ${docstringHTML}
        </div>
        <br>
        ${argumentsHTML ? `${argumentsHTML}` : ""}
      </li>
    `;
          });

          libraryListHTML += `</ul></li>`; // Close function list
        });
        libraryListHTML += `</ul>`; // Close library list

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
   * Generates HTML for a given function's arguments and keyword arguments.
   * @param {Object} functionData - Object containing function data, including arguments.
   * @param {number} cellNumber - Number of the cell containing the function.
   * @returns {string} - HTML string of the arguments and keyword arguments, or an empty string if neither exist.
   */
  const generateArgumentsHTML = (functionData, cellNumber) => {
    if (!functionData || !Array.isArray(functionData.arguments)) {
      return ""; // If no valid function data or arguments, return an empty string
    }
  
    const allArgs = [];
    const allKwargs = {};
  
    // Collect arguments and keyword arguments
    for (const argSet of functionData.arguments) {
      if (Array.isArray(argSet?.args)) {
        // Filter out empty arrays
        const validArgs = argSet.args.filter((arg) => {
          return !(Array.isArray(arg) && arg.length === 0); // Skip empty arrays
        });
        allArgs.push(...validArgs);
      }
  
      if (typeof argSet?.kwargs === "object" && argSet.kwargs !== null) {
        for (const [key, value] of Object.entries(argSet.kwargs)) {
          if (Array.isArray(value) && value.length === 0) {
            continue; // Skip empty arrays
          }
          allKwargs[key] = value;
        }
      }
    }
  
    let argsHTML = "";
    let kwargsHTML = "";
  
    // Generate HTML only if there are valid arguments
    if (allArgs.length > 0) {
      argsHTML = `
        <span class="args-label"><strong>Args:</strong></span>
        <span class="args-content">${allArgs.join(", ")}</span>`;
    }
  
    // Generate HTML only if there are valid keyword arguments
    if (Object.keys(allKwargs).length > 0) {
      const kwargs = Object.entries(allKwargs)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `<strong>${key}:</strong> [${value.join(", ")}]`; // Handle array formatting
          }
          return `<strong>${key}:</strong> ${value}`; // Handle other types
        })
        .join(", ");
      kwargsHTML = `
        <span class="kwargs-label"><strong>Kwargs:</strong></span>
        <span class="kwargs-content">${kwargs}</span>`;
    }
  
    // Combine args and kwargs into a list without a separator
    return `<ul class="nested-list-1">
              ${argsHTML ? `<li>${argsHTML}</li>` : ""}
              ${kwargsHTML ? `<li>${kwargsHTML}</li>` : ""}
            </ul>`;
  };
  
  /**
   * Highlights headings in the given text that are followed by hyphens.
   * The function identifies headings by matching lines followed by two or more hyphens.
   * It wraps each identified heading in a <span> element with the class "highlighted-heading".
   *
   * @param {string} text - The input text containing headings to highlight.
   * @returns {string} - The text with highlighted headings.
   */

  const highlightHeadings = (text) => {
    const pattern = /(^|\n)([^\n]+?)\n-{2,}/g; // Matches headings followed by ----- (hyphens)
    return text.replace(pattern, (match, prefix, heading) => {
      return `${prefix}<span class="highlighted-heading">${heading}</span>\n`; // Highlight the heading
    });
  };

  /**
   * Generates HTML for a given function's docstring, highlighting headings.
   *
   * @param {object} functionData - Object containing function data, including the docstring.
   * @returns {string} - HTML string of the highlighted docstring, or an empty string if not available.
   */

  const generateDocstringHTML = (functionData, headerId) => {
    let docstringHTML = "";
    if (functionData?.doc_string) {
      docstringHTML = `
        ${highlightHeadings(functionData.doc_string)}
        <div style="margin-top: 10px;">
          <a href="#ml-header-${headerId}" class="back-to-header" style="display: none;">back to header</a>
        </div>
      `;
    }
    return docstringHTML;
  };

  /**
   * Runs the Headergen extension.
   * Sends a POST request to the server with the current notebook as a JSON file.
   * Applies the analysis data returned by the server to the notebook.
   * Enables the "Toggle Headers" button and shows the sidebar.
   * Disables the "Run Headergen" button while the analysis is running.
   * Hides the spinner after the analysis is complete.
   * @returns {Promise<void>}
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

      const fixedServerUrl = "http://3di-1.cs.upb.de:80";

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
   * Creates a button element with the given properties.
   * @param {string} id - The id attribute of the button.
   * @param {string} text - The text content of the button.
   * @param {string} className - The class attribute of the button.
   * @param {Object} styles - An object of CSS styles to apply to the button.
   * @param {function} onClick - The function to call when the button is clicked.
   * @returns {HTMLElement} - The created button element.
   */
  const createButton = (id, text, className, styles, onClick) => {
    const button = document.createElement("button");
    button.id = id;
    button.innerHTML = text;
    button.className = className;
    Object.assign(button.style, styles);
    button.addEventListener("click", onClick);
    return button;
  };

  /**
   * Adds the Headergen buttons to the Jupyter notebook toolbar.
   * The buttons are added to the toolbar container with the class "container.toolbar".
   * The buttons are the "Run Headergen" button and the "Toggle Headers" button, which is
   * initially hidden.
   * The "Run Headergen" button is used to run the code analysis on the current notebook.
   * The "Toggle Headers" button is used to toggle the visibility of the machine learning
   * phase headers.
   * The buttons are styled with CSS styles and classes.
   */
  const addHeadergenButton = () => {
    const toolbarContainer = document.querySelector(".container.toolbar");
    if (!toolbarContainer) return;

    // Run Headergen Button
    const headergenButton = createButton(
      HEADERGEN_BUTTON_ID,
      "Run Headergen",
      "btn btn-primary",
      {
        margin: "5px",
        padding: "8px 15px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "14px",
        cursor: "pointer",
      },
      async () => {
        headergenButton.disabled = true;
        headergenButton.style.opacity = "0.6";
        headergenButton.style.cursor = "not-allowed";

        await runHeadergen();

        headergenButton.disabled = false;
        headergenButton.style.opacity = "1";
        headergenButton.style.cursor = "pointer";

        const toggleButton = document.getElementById(TOGGLE_BUTTON_ID);
        if (toggleButton) toggleButton.style.display = "inline-block";
      }
    );
    toolbarContainer.appendChild(headergenButton);

    // Toggle Headers Button
    const toggleButton = createButton(
      TOGGLE_BUTTON_ID,
      "Hide Headers",
      "btn btn-secondary",
      {
        margin: "5px",
        padding: "8px 15px",
        backgroundColor: "#6c757d",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "14px",
        cursor: "pointer",
        display: "none", // Initially hidden
      },
      () => {
        const headers = document.querySelectorAll(".ml-phase-container");
        const headersVisible = toggleButton.innerHTML === "Hide Headers";

        headers.forEach((header) => {
          header.style.display = headersVisible ? "none" : "block";
        });

        toggleButton.innerHTML = headersVisible
          ? "Show Headers"
          : "Hide Headers";
      }
    );
    toolbarContainer.appendChild(toggleButton);

    // Toggle Sidebar Button
    const sidebarToggleButton = createButton(
      SIDEBAR_TOGGLE_BUTTON_ID,
      "Hide Sidebar",
      "btn btn-secondary",
      {
        margin: "5px",
        padding: "8px 15px",
        backgroundColor: "#6c757d",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "14px",
        cursor: "pointer",
        display: "none", // Initially hidden
      },
      () => {
        const sidebar = getOrCreateSidebar();
        sidebar.classList.toggle(SIDEBAR_CLOSED_CLASS);
        sidebar.classList.toggle(SIDEBAR_OPEN_CLASS);

        // Update button text based on sidebar visibility
        sidebarToggleButton.innerHTML = sidebar.classList.contains(
          SIDEBAR_CLOSED_CLASS
        )
          ? "Show Sidebar"
          : "Hide Sidebar";
      }
    );

    toolbarContainer.appendChild(sidebarToggleButton);
  };

  /**
   * Initializes the Headergen extension.
   * Adds the "Run Headergen" button to the notebook toolbar.
   */
  const load_ipython_extension = () => {
    addHeadergenButton();
  };

  return {
    load_ipython_extension: load_ipython_extension,
  };
});
