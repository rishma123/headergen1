from setuptools import setup, find_packages

setup(
    name='headergen_extension',
    version='0.2.1',
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
    zip_safe=False,
)