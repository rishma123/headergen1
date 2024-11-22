from setuptools import setup, find_packages

setup(
    name='headergen1',
    version='1.0.3',
    description='A Jupyter Notebook extension to convert undocumented notebooks to documented notebooks.',
    packages=find_packages(include=['headergen1', 'headergen1.*']),  # This ensures that static folder is included
    include_package_data=True,  # To include non-Python files
    data_files=[  # Ensure this points to the right locations for JS and JSON
        ('share/jupyter/nbextensions/headergen1', [
            'headergen1/main.js',  # This is your main JavaScript file
        ]),
        ('etc/jupyter/nbconfig/notebook.d', [
            'headergen1/headergen1.json',  # The config JSON file
        ])
    ],
    zip_safe=False,
    install_requires=[
        'notebook',
    ],
)
