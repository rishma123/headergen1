def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'headergen1',  # This points to the folder where your JS file is located
        'dest': 'headergen1',  # The extension's destination
        'require': 'headergen1/main',  # This should match the main JS file location
    }]
