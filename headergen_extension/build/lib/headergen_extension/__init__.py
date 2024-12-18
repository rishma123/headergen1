def _jupyter_nbextension_paths():
    return [{
        "section": "notebook",  # Specifies the section (e.g., notebook, tree)
        "src": "static",       # Directory relative to the module containing static files
        "dest": "headergen_extension",  # Directory name for the nbextension installation
        "require": "headergen_extension/main"  # Entry point for the extension
    }]