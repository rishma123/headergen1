# Headergen1

Headergen1 is a Jupyter Notebook extension designed to help convert undocumented notebooks into well-documented ones by generating and managing headers automatically.

## Prerequisites
Before you begin, make sure you meet the following requirements:

Python 3.x installed on your system.

Jupyter Notebook version 6.0.3 or compatible.

jupyter-server version 1.24.0 (or compatible).

## Installation
To install and use the headergen-extension Jupyter Notebook extension, follow the instructions below:

### Step 1: Install the Extension
To install the extension from PyPI, simply run the following command:

`pip install headergen-extension`
This will install the extension and all necessary dependencies directly from PyPI.

### Step 2: Enable the Extension
After installing, you need to enable the extension in your Jupyter Notebook environment. Run the following command:

`jupyter nbextension enable headergen1/main`

### Step 3: (Optional) Install Jupyter Server Version 1.24.0 (if needed)
If you're encountering issues with starting Jupyter Notebook, make sure that you have jupyter-server==1.24.0 installed. You can install the compatible version by running:

`pip install jupyter-server==1.24.0`

### Step 4: Start Jupyter Notebook
Once everything is installed and enabled, start Jupyter Notebook by running:
`jupyter notebook`
This will open the Jupyter interface in your browser.

