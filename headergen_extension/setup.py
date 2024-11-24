from setuptools import setup, find_packages

setup(
    name='headergen_extension',
    version='0.1.1',
    description='A Jupyter Notebook extension that generates documentation for notebooks that lack proper documentation.',
    long_description=open("README.md", "r", encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    packages=find_packages(),
    package_data={
        'headergen_extension': [
            'static/main.js',
            'extension.json'
        ]
    },
    include_package_data=True,
    install_requires=[
        'notebook<7',
        'jupyter_contrib_nbextensions'
    ],
    # entry_points={
    #     'jupyter_nbextension': [
    #         'headergen_extension = headergen_extension.main:load_ipython_extension'
    #     ]
    # },
    # data_files=[  # Ensure this points to the right locations for JS and JSON
    #     ('share/jupyter/nbextensions/headergen_extension', [
    #         'headergen_extension/static/main.js',  # This is your main JavaScript file
    #     ]),
    #     ('etc/jupyter/nbconfig/notebook.d', [
    #         'headergen_extension/extension.json',  # The config JSON file
    #     ])
    # ],
    zip_safe=False,
)