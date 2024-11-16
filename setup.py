from setuptools import setup, find_packages

setup(
    name='headergen1',
    version='0.1',
    packages=find_packages(),
    include_package_data=True,
    data_files=[
        ('share/jupyter/nbextensions/headergen1', [
            'headergen1/main.js',
        ]),
        ('etc/jupyter/nbconfig/notebook.d', [
            'headergen1.json'
        ])
    ],
    zip_safe=False,
    install_requires=[
        'notebook',
    ],
    entry_points={
        'console_scripts': [
            'headergen1 = headergen1:main',
        ]
    }
)