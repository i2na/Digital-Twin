# gbXML to IDF Translator
The gbXML2IDF translator is a newly created middleware solution built on Python. This translator facilitates the conversion of Building Information Modeling (BIM) models from the gbXML format, to Energy Plus model, the IDF format. The [gbXML](https://www.gbxml.org/) is an open-source schema tailored for containing the necessary data for energy simulations and IDF is a format for Building Energy Modeling (BEM) files supported by the EnergyPlus simulation engine.

This tool functions by mapping various building properties from the gbXML schema to the IDF data format. It extracts details such as geometry, thermal properties, heat gains, occupancy/lighting/equipment schedules, and HVAC specifics from the gbXML file and converts them into IDF data classes. Furthermore, it incorporates default schedules, HVAC objects, and output objects from a library to supplement any missing data.

![](https://github.com/Udaragithub/gbXML2IDF/blob/main/Images/Research%20Gap%20and%20Proposed%20Tool%20(18).png)

A rich picture of data mapping is shown below,

![](https://github.com/Udaragithub/gbXML2IDF/blob/main/Images/Research%20Gap%20and%20Proposed%20Tool%20(17).png)

## How to use this script?
Before you use this script, you need to prepare the BIM model using the PDS-template.rte Revit template file. Then run energy model preparation command in Revit and export gbXML file from the software.

> [!IMPORTANT]
> Spaces must be defined for enclosed areas (Ex- bed rooms) and the correct space type should be selected from the items with BIM abbrevation in the Revit template file. You can select Adiabatic floor or walls to model adiabatic surfaces

+ Step 01 - Install python packages : lxml, xgbxml, eppy
- Step 02 - Download gbxmlconvertor.py, GUI_01_BIM2BEM_Convertor.py and Template files folder in to the same folder
* Step 03 - Modify Two template files (IDF_template.idf and IDF_schedules.idf files) if needed.
+ Step 04 - Run GUI_01_BIM2BEM_Convertor.py and input, working folder (which contains gbXML file), IDF_template.idf file location and IDF-Schedule.idf file location)

1. eplusrevit.idf - Ready-to-simulate IDF file
2. material_data.csv - Summary of material data mapping (Material name of BIM file) and corresponding IDF name
3. space_data.csv - Summary of space data (name, occupants, heat gain values) and corresponding IDF name

> [!WARNING]
> In the latest version of the translator, occupancy,lighting and equipment schedules are mapped by the name in Revit template file. If you do not use the template file, there will be errors in IDF file.
Now following files will be created in the working folder.

## Are you familiar with Dynamo for Revit?
A seperate Dynamo script is prepared which converts Autodesk Revit model into an IDF file with a single-click. Check the Dynamo script folder

## Validation of the translator with test cases
To be updated

## Research works
To be updated
