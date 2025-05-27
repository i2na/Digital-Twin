#Code prepared by Udara Sachinthana . Contact - mail.sachinthana@gmail.com for more details


# Last updated 05/02/2024
# Converted to a python function 11/11/2023
# Need to fix ardiabatic surface error
# Mapped occupancy, lighting, equipment schedules with default schedules in schedules files 
# Need to fix error in mapping complex geometries

from lxml import etree
import xgbxml
from eppy import modeleditor
from eppy.modeleditor import IDF

def convertor(workdir,iddfile,gbxmlfile,idfsch,idftemp):

    #Code starts here :)
    parser=xgbxml.get_parser('0.37')
    tree=etree.parse(gbxmlfile, parser)
    gbxml=tree.getroot()
    
    #==================General building data=================================================
    
    #"In the current version, the translator only supports translation of building surfaces,construction,materials and schedules."
    
    #===========Campus Translator to convert surfaces to idf format============================
    
    idf_building_surfaces=[]
    idf_shading_surface=[]
    idf_fenestration_surfaces=[]
    
    for surface in gbxml.Campus.Surfaces:
        
        #================================BuildingSurface:Detailed================================
        if surface.surfaceType!='Shade': #Shadings are considered as seperate surfaces
            
            surface_id=surface.id
            surface_type='Wall' if surface.surfaceType=='InteriorWall' or surface.surfaceType=='ExteriorWall' else 'Floor' if surface.surfaceType=='SlabOnGrade' or surface.surfaceType=='RaisedFloor' or surface.surfaceType=='InteriorFloor' else 'Roof' if surface.surfaceType=='Roof' else 'adiabatic'
            construction_name=surface.constructionIdRef
            sun='NoSun' if surface.surfaceType=='InteriorWall' or surface.surfaceType=='Ceiling' or surface.surfaceType=='RaisedFloor' else 'SunExposed' if surface.surfaceType=='Floor' else 'SunExposed'
            wind='NoWind' if surface.surfaceType=='InteriorWall' or surface.surfaceType=='Ceiling' or surface.surfaceType=='RaisedFloor' else 'WindExposed' if surface.surfaceType=='Floor' else 'WindExposed'
            adj_zone=surface.AdjacentSpaceIds.spaceIdRef
            
            try:
                adiabatic_floor=surface.CADObjectId.text[7:16]
                adiabatic_wall=surface.CADObjectId.text[12:21]
            except KeyError:
                continue

            
            out_boundary='Adiabatic' if adiabatic_floor=='Adiabatic' or adiabatic_wall=='Adiabatic' else 'Outdoors'if surface.surfaceType=='ExteriorWall' or surface.surfaceType=='Roof' else 'Zone' if surface.surfaceType=='InteriorWall' or surface.surfaceType=='Ceiling' or surface.surfaceType=='InteriorFloor' or surface.surfaceType=='RaisedFloor' or surface.surfaceType=='Air'  else 'Ground' if surface.surfaceType=='SlabOnGrade' else None
            if out_boundary is None:
                raise TypeError("Incompatible surface")
            
            out_boundary_obj='' if adiabatic_floor=='Adiabatic' or adiabatic_wall=='Adiabatic' else adj_zone[-1] if surface.surfaceType=='InteriorWall' or surface.surfaceType=='Ceiling' or surface.surfaceType=='RaisedFloor' or surface.surfaceType=='InteriorFloor' else ''
            no_vertice=surface.PlanarGeometry.PolyLoop.get_coordinates()
            num_vertices=len(no_vertice)
            vertices=[]
            for i in no_vertice:
                [vertices.append(j) for j in i]
            vertices_str=str(vertices).replace("[", "").replace("]", "")
            
    
    
            idf_surface = f"""
            BuildingSurface:Detailed,
                {surface_id},          !- Name
                {surface_type},        !- Surface Type
                {construction_name},   !- Construction Name
                {adj_zone[0]},           !- Zone Name
                {out_boundary},           !- Outside Boundary Condition
                {out_boundary_obj},     !- Outside Boundary Condition Object
                {sun},                      !- Sun Exposure
                {wind},                      !- Wind Exposure
                0,                      !- View Factor to Ground
                {num_vertices},        !- Number of Vertices
                {vertices_str};        !- Vertex List
        """
            idf_building_surfaces.append(idf_surface)
    
    
            #==============================Fenistration:Surface:Detailed==============================
            for opening in surface.Openings:
    
                opening_id=opening.id
                window_construction=opening.windowTypeIdRef
                opening_type='Window' if opening.openingType=='FixedWindow' or opening.openingType=='OperableWindow' else 'Door'
                no_vertice=opening.PlanarGeometry.PolyLoop.get_coordinates()
                num_vertices=len(no_vertice)
                vertices=[]
                for i in no_vertice:
                    [vertices.append(j) for j in i]
                vertices_str=str(vertices).replace("[", "").replace("]", "")
    
                idf_fenestration = f"""
                FenestrationSurface:Detailed,
                    {opening_id},          !- Name  
                    {opening_type},        !- Surface Type
                    {window_construction}, !- Construction Name
                    {surface_id},          !- Building Surface Name
                    ,                 !- Outside Boundary Condition 
                    autocalculate,                !- View Factor to Ground
                    ,        !- Shading control name
                    ,                       !- Frame and Divider Name
                    ,                       !- Multiplier
                    {num_vertices},                       !- Number of Vertices
                    {vertices_str};        !- Vertex List
            """	
                idf_fenestration_surfaces.append(idf_fenestration)  
        
        #================================ Shading:Building:Detailed ================================
        else:
            surface_id=surface.id
            no_vertice=surface.PlanarGeometry.PolyLoop.get_coordinates()
            num_vertices=len(no_vertice)
            vertices=[]
            for i in no_vertice:
                [vertices.append(j) for j in i]
            vertices_str=str(vertices).replace("[", "").replace("]", "")
            
    
    
            idf_shading = f"""
            Shading:Building:Detailed,
                {surface_id},          !- Name
                ,        !- Transmittance Schedule Name
                {num_vertices},   !- Number of vertices
                {vertices_str};           !- Vertices
    
        """
            idf_shading_surface.append(idf_shading)
    
    #============================== Constructions ===========================================
    
    # Define lists to store IDF strings
    
    idf_constructions = []
    
    
    for construction in gbxml.Constructions:
        # Get the construction name and material layers
        construction_name = construction.get("id")
        layer_id=construction.LayerId.layerIdRef
        material_layers = []
        for layer in gbxml.Layers:
            if layer.get("id")==layer_id:
                layers=layer.MaterialIds.materialIdRef
        print(layers)
        # Define the construction string
        
        if len(layers)!=1:
            construction_string = f"""
            Construction,
                {construction_name}, !- Name
                {str(layers).replace("(", "").replace(")", "").replace("'",'')}; !- Outside Layer
            """
        else:
            construction_string = f"""
            Construction,
                {construction_name}, !- Name
                {str(layers).replace("(", "").replace(",)", "").replace("'",'')}; !- Outside Layer
            """
                
        # Append the construction string to the list
        idf_constructions.append(construction_string)    
    
    for window in gbxml.WindowTypes:
        # Get the construction name and material layers
        window_name = window.get("id")
        
        # Define the construction string for windows
        construction_window = f"""
        Construction,
            {window_name}, !- Name
            {window.Name.text}; !- Outside Layer
        """
        
        # Append the construction string to the list
        idf_constructions.append(construction_window)      
    #================================= Materials ============================================
    idf_materials = []
    material_data={}
    
    for material in gbxml.Materials:
        if material.Name.text!='Air space':
            material_id=material.get("id")
            material_name=material.Name.text
            
            try:
                material_thermal_conductivity=material.Conductivity.text
                
                material_thickness=material.Thickness.text
                material_density=material.Density.text
                material_sh=material.SpecificHeat.text
            except KeyError:
                continue
            
            idf_material = f"""
            Material,
                {material_id}, !- Name
                MediumRough, !- Roughness
                {material_thickness}, !- Thickness (m)
                {material_thermal_conductivity}, !- Thermal Conductivity (material_thermal_conductivity)
                {material_density}, !- Density (material_density)
                {material_sh}, !- Specific Heat (material_sh)
                0.9, !- Thermal Absorptance
                0.7, !- Solar Absorptance
                0.7; !- Visible Absorptance
            """
        elif material.Name.text=='Air space':
            material_id=material.get("id")
            material_name=material.Name.text
            material_R_value=material.R_value.text
            idf_material = f"""
                
                Material:NoMass,
                    {material_id}, !- Name
                    Smooth, !- Roughness
                    {material_R_value}; ! Thermal Resistance
                    
                """
        
        else: raise ValueError
        material_data[material_id]={'Material ID' : material_id,
                                    'Material Name':material_name

        }
        idf_materials.append(idf_material)
    
    
    #============================= WindowMaterial:SimpleGlazingSystem =========================
    idf_window_materials = []
    
    for window in gbxml.WindowTypes:
        win_mat_id=window.get("id")
        win_mat_name=window.Name.text
        win_mat_u_value=window.U_value.text
        win_mat_shgc=window.SolarHeatGainCoeffs[-1].text
    
        idf_window_material = f"""
        WindowMaterial:SimpleGlazingSystem,
            {win_mat_name}, !- Name
            {win_mat_u_value}, !- U-Factor (win_mat.u_value)
            {win_mat_shgc}, !- Solar Heat Gain Coefficient (win_mat.shgc)
            0.9; !- Visible Transmittance
        """
        idf_window_materials.append(idf_window_material)
    
    #=============================Schedules================================
    schedule_data={}

    for schedule in gbxml.Schedules:
            schedule_id=schedule.get("id")
            schedule_name=schedule.Name.text
            schedule_data[schedule_id]={'schedule id':schedule_id,
                                        'schedule name':schedule_name

            }

    
    #========================== Zone =============================================
    idf_zones = []
    space_data = {} # Initialize empty dictionary to store schedule and people data for each space
    for space in gbxml.Campus.Building.Spaces: 
            zone_id=space.get("id")
            
            idf_zone = f"""
            Zone,
                {zone_id}, !- Name
                0, !- Direction of Relative North (zone.Name.text)
                0, !- X Origin
                0, !- Y Origin
                0, !- Z Origin
                1, !- Type
                1, !- Multiplier
                autocalculate, !- Ceiling Height (zone.CeilingHeight.text)
                autocalculate, !- Volume
                autocalculate, !- Floor Area
                TARP, !- Zone Inside Convection Algorithm
                ; !- Zone Outside Convection Algorithm
            """
            idf_zones.append(idf_zone)
            # Extract space ID
        
            
            #============================ Extract additional data for each space ========================
    
            # Extract lighting schedule ID and density
            lighting_schedule_id = space.lightScheduleIdRef
            lighting_density = space.LightPowerPerArea.text
        
            # Extract equipment schedule ID and density
            equipment_schedule_id = space.equipmentScheduleIdRef
            equipment_density = space.EquipPowerPerArea.text
        
            # Extract people schedule ID, number of people, and total heat gain
            people_schedule_id = space.peopleScheduleIdRef
            people_schedule_name=schedule_data[people_schedule_id]['schedule name']
            
            num_people = float(space.PeopleNumber.text)
            
            heat_gain = space.PeopleHeatGains[0].text
            
            CAD_name=space.Name.text #Extract name assigned in BIM
    
            #extract other info
            zone_name="aim0408"
            try:
                conditionType=space.conditionType
            except KeyError: 
                conditionType="Cooled"
            storeyid=space.buildingStoreyIdRef
        
            # Add data to dictionary for this space
            space_data[zone_id] = {'Lighting Schedule ID': lighting_schedule_id,
                                    'Lighting Density': lighting_density,
                                    'Equipment Schedule ID': equipment_schedule_id,
                                    'Equipment Density': equipment_density,
                                    'People Schedule Name': people_schedule_name,
                                    'Number of People': num_people,
                                    'Total Heat Gain': heat_gain,

                                    'Zone Name': zone_name,
                                    'Condition Type': conditionType,
                                    'CAD Name': CAD_name,
                                    'storeyID': storeyid}
    

    #============================= ZoneData =================================

    
    #============================= People =================================
    idf_peoples= []
    for spaceid,values in space_data.items():
        
        if values['Number of People'] != 0:
            idf_people= f"""
            People,
            {spaceid+'people'},  !- Name
            {spaceid}, !- Zone or ZoneList Name
            {values['People Schedule Name']+'occupancy_sch'}, !- Number of People Schedule Name
            People, !- Number of People Calculation Method
            {values['Number of People']}, !- Number of People
            , !- People per Zone Floor Area
            , !- Zone Floor Area per Person
            0.3, !- Fraction Radiant
            autocalculate, !- Sensible Heat Fraction
            Activity_Sch, !- Activity Level Schedule Name
            , !- Carbon Dioxide Generation Rate (m3/s-W)
            , !- Enable ASHRAE 55 Comfort Warnings
            {'ZoneAveraged'.replace("'","")}, !- Mean Radiant Temperature Calculation Type
            , !- Surface Name/Angle Factor List Name
            , !- Work Efficiency Schedule Name
            , !- Clothing Insulation Calculation Method
            , !- Clothing Insulation Calculation Method Schedule Name
            , !- Clothing Insulation Schedule Name
            , !- Air Velocity Schedule Name
            {'AdaptiveASH55'.replace("'","")}, !-Thermal Comfort Model 1 Type
            {'AdaptiveCEN15251'.replace("'","")}; !- Thermal Comfort Model 2 Type
    """
            idf_peoples.append(idf_people)
    
    #============================= Lights =================================
    idf_lights= []
    for spaceid,values in space_data.items():
        
        if values['Lighting Density'] != 0:
            idf_light= f"""
            Lights,
            {spaceid+'light'},  !- Name
            {spaceid}, !- Zone or ZoneList Name
            {values['People Schedule Name']+'lighting_sch'}, !- Schedule Name
            {'Watts/Area'.replace("'","")}, !- Design Level Calculation Method
            , !- Lighting Level (W/m2)
            {values['Lighting Density']}, !- Watts per Zone Floor Area (W/m2)
            , !- Watts per Person (W/person)
            0, !- Return Air Fraction
            0.32, !- Fraction Radiant
            0.23, !- Fraction Visible
            0.45, !- Fraction Replaceable
            GeneralLights; !- End-Use Subcategory
    """
            idf_lights.append(idf_light)
    
    #============================= Electric Equipment =================================
    idf_equipments= []
    for spaceid,values in space_data.items():
            
            if values['Equipment Density'] != 0:
                idf_equipment= f"""
                ElectricEquipment,
                {spaceid+'equipment'},  !- Name
                {spaceid}, !- Zone or ZoneList Name
                {values['People Schedule Name']+'equipment_sch'}, !- Schedule Name
                {'Watts/Area'.replace("'","")}, !- Design Level Calculation Method
                , !- Lighting Level (W/m2)
                {values['Equipment Density']}, !- Watts per Zone Floor Area (W/m2)
                , !- Watts per Person (W/person)
                0.3, !- Fraction Radiant
                0.2, !- Fraction Visible
            0.0, !- Fraction Lost
                General; !- End-Use Subcategory
        """
                idf_equipments.append(idf_equipment)
    
    #=================== HVAC system ========================
    idf_vent1=[]
    idf_vent2=[]

    for spaceid,values in space_data.items():
        idf_air2= f"""
        ZoneInfiltration:DesignFlowRate,
            {spaceid+'infil'},   !- Name
            {spaceid}, !- Zone Name
            24X7_on, !- Schedule Name
            AirChanges/Hour,      !- Design Flow Rate Calculation Method
            ,       !- Design Flow Rate 
            ,               !- Flow per Zone Floor Area 
            ,               !- Flow per Exterior Surface Area
            0.5,               !- Air Changes per Hour
            0.6060000    ,  !- Constant Term Coefficient
            3.6359996E-02,  !- Temperature Term Coefficient
            0.1177165    ,  !- Velocity Term Coefficient
            0.0000000E+00;  !- Velocity Squared Term Coefficient
        """
        idf_vent2.append(idf_air2)
    
    for spaceid,values in space_data.items():
        
        if values['Condition Type']=="HeatedAndCooled" or values['Condition Type']=="Cooled" :

            idf_air1= f"""
            ZoneVentilation:DesignFlowRate,
            {spaceid+'vent'},        !-Name
            {spaceid},                !- Zone Name
            24X7_on,          !- SCHEDULE Name
            AirChanges/Hour,               !- Design Volume Flow Rate calculation method
            ,                  !- Design Volume Flow Rate 
            ,                        !- Volume Flow Rate per area 
            ,                        !- Volume Flow Rate per person 
            2,                        !- Air Changes Per Hour
            Natural,                  !- Ventilation Type
            67.,                     !- Fan Pressure Rise
            .7,                      !- Fan Total Efficiency
            1,                       !- Constant Term Coefficient
            0,                       !- Temperature Term Coefficient
            0,                       !- Velocity Term Coefficient
            0,                       !- Velocity Squared Term Coefficient
            21,                        !- Minimum Indoor Temperature 
            ,           !- Minimum Indoor Temperature Schedule Name
            24,                        !- Maximum Indoor Temperature 
            ,           !- Maximum Indoor Temperature Schedule Name
            ,                        !- Delta Temperature 
            ,               !- Delta Temperature Schedule Name
            ,                        !- Minimum Outdoor Temperature 
            ,          !- Minimum Outdoor Temperature Schedule Name
            ,                        !- Maximum Outdoor Temperature
            ,          !- Maximum Outdoor Temperature Schedule Name
            40;                      !- Maximum WindSpeed 
        
        """	
            idf_vent1.append(idf_air1)
    
    
    
    idf_hvacs=[]
    idf_ventobjs=[]
    for spaceid,values in space_data.items():
        # if values['Condition Type']=="HeatedAndCooled" or values['Condition Type']=="Cooled" :
        #     idf_hvac= f"""
        #     HVACTemplate:Zone:IdealLoadsAirSystem,
        #     {spaceid}, !- Zone Name
        #     {values['People Schedule Name']+'DualSP'}, !- Template Thermostat Name
        #     24X7_on, !- System Availability Schedule Name
        #     50, !- Maximum Heating Supply Air Temperature 
        #     13, !- Minimum Cooling Supply Air Temperature 
        #     0.0156, !- Maximum Heating Supply Air Humidity Ratio 
        #     0.0077, !- Minimum Cooling Supply Air Humidity Ratio 
        #     NoLimit, !- Heating Limit
        #     autocalculate, !- Maximum Heating Air Flow Rate 
        #     autocalculate, !- Maximum Sensible Heating Capacity
        #     LimitFlowRateAndCapacity, !- Cooling Limit
        #     autocalculate, !- Maximum Cooling Air Flow Rate 
        #     autocalculate, !- Maximum Total Cooling Capacity 
        #     24X7_on, !- Heating Availability Schedule Name
        #     24X7_on, !- Cooling Availability Schedule Name
        #     None, !- Dehumidification Control Type
        #     0.7, !- Cooling Sensible Heat Ratio 
        #     60, !- Dehumidification Setpoint
        #     None,!-Dehumification Control Type
        #     , !- Humdification Setpoint
        #     DetailedSpecification, !- Outdoor Air Method
        #     , !- Outdoor Air Flow Rate per Person (m3/s-person)
        #     , !- Outdoor Air Flow Rate per Zone Floor Area (m3/s-m2)
        #     , !- Outdoor Air Flow Rate per Zone (m3/s)
        #     , !- Design Specification Outdoor Air Object Name
        #     None, !- Demand Controlled Ventilation Type
        #     NoEconomizer, !- Outdoor Air Economizer Type
        #     None, !- Heat Recovery Type
        #     0.7, !- Sensible Heat Recovery Effectiveness (dimensionless)
        #     0.65; !- Latent Heat Recovery Effectiveness (dimensionless)
            
        #     """
        #     idf_hvacs.append(idf_hvac)
        
        if values['Condition Type']=="HeatedAndCooled" or values['Condition Type']=="Cooled": 
            idf_hvac= f"""
            HVACTemplate:System:Unitary,
            {spaceid+'AHU'},                   !- Air Handling System Name
            24X7_on,    !- System Availability Schedule
            {spaceid},               !- Control Zone Name or Thermostat Location
            autosize,                !- Supply Fan Max Flow Rate 
            24X7_on,       !- Supply Fan Operating Mode Schedule
            .7,                      !- Supply Fan Total Efficiency
            600,                     !- Supply Fan Delta Pressure
            .9,                      !- Supply Fan Motor Efficiency
            1,                       !- Supply Fan Motor in Air Stream Fraction
            SingleSpeedDX,          !- Cooling Coil Type
            {values['People Schedule Name']+'occupancy_sch'},    !- Cooling Coil Availability Schedule
            14.0,                    !- Cooling Design Supply Air Temperature
            autosize,                !- Cooling Coil Gross Rated Total Capacity
            autosize,                !- Cooling Coil Gross Rated Sensible Heat Ratio
            3,                       !- Cooling Coil Gross Rated COP
            Electric,                     !- Heating Coil Type
            {values['People Schedule Name']+'occupancy_sch'},    !- Heating Coil Availability Schedule
            50.0,                    !- Heating Design Supply Air Temperature 
            autosize,                !- Heating Coil Capacity
            .8,                      !- Gas Heating Coil Efficiency
            0,                       !- Gas Heating Coil Parasitic Electric Load 
            autosize,                !- Maximum Outdoor air Flow Rate
            autosize,                !- Minimum Outdoor air Flow Rate 
            ,                        !- Minimum Outdoor air Schedule Name
            NoEconomizer,            !- Economizer Type
            NoLockout,               !- Economizer Lockout
            ,                        !- Economizer Upper Temperature Limit
            ,                        !- Economizer Lower Temperature Limit 
            ,                        !- Economizer Upper Enthalpy Limit
            ,                        !- Economizer Maximum Limit Dewpoint Temperature 
            ,                        !- Supply Plenum Name
            ,                        !- Return Plenum Name
            BlowThrough,             !- Supply Fan Placement
            CycleOnAny,              !- Night Cycle Control
            ,                        !- Night Cycle Control Zone Name
            None,                    !- Heat Recovery Type
            ,                        !- Sensible Heat Recovery Effectiveness
            ,                        !- Latent Heat Recovery Effectiveness
            None,                    !- Dehumidification Control Type
            60,                      !- Dehumidification Setpoint 
            ,           !- Humidifier Type
            ,                        !- Humidifier Availability Schedule
            0.000001,                !- Humidifier Rated Capacity 
            2690,                    !- Humidifier Rated Electric Power 
            ,               !- Humidifier Control Zone Name
            30,                      !- Humidifier Setpoint
            No,                      !- Return Fan
            0.7,                     !- Return Fan Total Efficiency
            300,                     !- Return Fan Delta Pressure 
            0.9,                     !- Return Fan Motor Efficiency
            1.0;                     !- Return Fan Motor in Air Stream Fraction


            """
            idf_ventobj= f"""
            HVACTemplate:Zone:Unitary,
            {spaceid},                !- Zone Name
            {spaceid+'AHU'},          !- Template Unitary System Name
            {values['People Schedule Name']+'DualSP'},               !- Template Thermostat Name
            autosize,                !- Supply Air Maximum Flow Rate 
            ,                        !- Zone Heating Sizing Factor
            ,                        !- Zone Cooling Sizing Factor
            flow/person,             !- Outdoor Air Method
            0.00944,                 !- Outdoor Air Flow Rate per Person 
            0.0,               !- Outdoor Air Flow Rate per Zone Floor Area 
            0.0,                     !- Outdoor Air Flow Rate per Zone 
            ,                        !- Supply Plenum Name
            ,                        !- Return Plenum Name
            None,                    !- Baseboard Heating Type
            ,                        !- Baseboard Heating Availability Schedule Name
            Autosize,                !- Baseboard Heating Capacity 
            SystemSupplyAirTemperature, !- Zone Cooling Design Supply Air
            ,            !- Zone Cooling Design Supply Air Temperature 
            ,            !- Zone Cooling Design Supply Air Temperature Difference 
            SystemSupplyAirTemperature, !- Zone Heating Design Supply Air . . . Input Method
            ,            !- Zone Heating Design Supply Air Temperature 
            ,            !- Zone Heating Design Supply Air Temperature Difference 
            ,            !- Design Specification Outdoor Air Object Name
            ;            !- Design Specification Zone Air Distribution Object Name


            """
            
            idf_hvacs.append(idf_hvac)
            idf_ventobjs.append(idf_ventobj)


            
    
    
    #================== open the template file and write the new file ========================
    
    with open(workdir+'\eplusrevit_temp.idf', "w") as f:
        # Read the original file and write its contents to the new file
        
        
        
        with open(idftemp, "r") as tempfile:
            f.write(tempfile.read())
            tempfile.close()
        with open(idfsch, "r") as tempfile:
            f.write(tempfile.read())
            tempfile.close()
        for idf_construction in idf_constructions:
            f.write(idf_construction + '\n')
        for idf_surface in idf_building_surfaces:
            f.write(idf_surface + '\n')
        for idf_shading in idf_shading_surface:
            f.write(idf_shading + '\n')
        for idf_fenestration in idf_fenestration_surfaces:
            f.write(idf_fenestration + '\n')
        for idf_material in idf_materials:
            f.write(idf_material + '\n')
        for idf_window_material in idf_window_materials:
            f.write(idf_window_material + '\n')
        for idf_zone in idf_zones:
            f.write(idf_zone + '\n')
        for idf_people in idf_peoples:
            f.write(idf_people + '\n')
        for idf_light in idf_lights:
            f.write(idf_light + '\n')
        for idf_equipment in idf_equipments:
            f.write(idf_equipment + '\n')
        for idf_air in idf_vent1:
            f.write(idf_air + '\n')
        for idf_air in idf_vent2:
            f.write(idf_air + '\n')
        for idf_hvac in idf_hvacs:
            f.write(idf_hvac + '\n')
        for idf_ventobj in idf_ventobjs:
            f.write(idf_ventobj + '\n')           
    f.close()


    IDF.setiddname(iddfile)
    idfpath = workdir+'\eplusrevit_temp.idf'
    print(idfpath)
    new_idf_path = workdir+'\eplusrevit.idf'
    idf =IDF(idfpath)
    idf.saveas(new_idf_path)



    import csv

    # Assuming you have the space_data dictionary defined

    # Specify the desired order of columns
    columns = ['zone_id', 'Lighting Schedule ID','Lighting Density', 'Equipment Schedule ID', 'Equipment Density',
            'People Schedule Name', 'Number of People', 'Total Heat Gain',
            'Zone Name', 'Condition Type', 'CAD Name', 'storeyID']

    # Define the file name and open it in write mode
    filename = workdir+'\space_data.csv'
    with open(filename, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=columns)

        # Write the header row
        writer.writeheader()

        # Write the data rows
        for zone_id, zone_data in space_data.items():
            # Add the zone_id to the zone_data dictionary
            zone_data['zone_id'] = zone_id
            writer.writerow(zone_data)


    #Assuming material_data dictionary defined
    columns = ['Material ID','Material Name']
    print(material_data)
    # Define the file name and open it in write mode
    filename = workdir+'\material_data.csv'
    with open(filename, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=columns)

        # Write the header row
        writer.writeheader()

        # Write the data rows
        for key, value in material_data.items():
            # Add the zone_id to the zone_data dictionary
            
            writer.writerow(value)   



# workdir=r"D:/MSc/BIM-Energy/Extreme weather project/idf"
# iddfile=r"C:\EnergyPlusV8-9-0\Energy+.idd"
# gbxmlfile=r"D:\MSc\BIM-Energy\Extreme weather project\BIM\Harmony Block_2_v2.xml"
# idftemp=r"D:\MSc\BIM-Energy\Extreme weather project\idf\IDF_template.idf"
# idfsch=r"D:\MSc\BIM-Energy\Extreme weather project\idf\IDF_Schedules.idf"

# convertor(workdir,iddfile,gbxmlfile,idfsch,idftemp)





