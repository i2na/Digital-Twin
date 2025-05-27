import tkinter as tk
from tkinter import filedialog
import gbxmlconvertor as gb
import jEplus_convertor as je


#main function of this code
def gbxml2idf():
    # Get user inputs
    gbxml_file = gbxml_entry.get()
    template_file = template_entry.get()
    schedule_file = schedule_entry.get()
    working_folder = working_folder_entry.get()
    idd_file = IDD_entry.get()


    # Call the convertor function with the inputs
    gb.convertor(working_folder, idd_file, gbxml_file, schedule_file, template_file)


#main function of this code
def idf2jeplus():
    exterior_material = exterior_material_entry.get()
    plaster_material = plaster_material_entry.get()
    working_folder = working_folder_entry.get()
    idd_file = IDD_entry.get()
    idf_file=idffile_entry.get()

    idf=je.importfiles(idd_file,idf_file,working_folder)
    windows=je.windowobj(idf)
    je.addoverhang(idf,windows,Depth="@@overhang@@")
    je.addsidefin(idf,windows,Left_Depth="@@sidefin@@",Right_Depth="@@sidefin@@")
    je.wallprop(idf,exterior_material,plaster_material)
    je.glasprop(idf)


# Function to browse and set file paths
def browse_file(entry_widget):
    file_path = filedialog.askopenfilename()
    entry_widget.delete(0, tk.END)
    entry_widget.insert(0, file_path)

def browse_folder(entry_widget):
    folder_path = filedialog.askdirectory()
    entry_widget.delete(0, tk.END)
    entry_widget.insert(0, folder_path)

# Create the main window
root = tk.Tk()
root.title("BIM to BEM convertor")

#----------------------------------------------------------------------------------------------
#Create a label frame for common inputs
group0_frame = tk.LabelFrame(root, text="Common Inputs")
group0_frame.grid(row=0, column=0, padx=10, pady=10, columnspan=4)

# Create labels and entry widgets for the second group
tk.Label(group0_frame, text="IDD file:").grid(row=4, column=0, sticky="e")
IDD_entry = tk.Entry(group0_frame, width=50)
IDD_entry.grid(row=4, column=1, columnspan=2)
tk.Button(group0_frame, text="Browse", command=lambda: browse_file(IDD_entry)).grid(row=4, column=3)
default_file_path = r"C:\EnergyPlusV8-9-0\Energy+.idd"   #Default file path avoid user to enter unneccessary inputs
IDD_entry.insert(0, default_file_path)

tk.Label(group0_frame, text="Working folder:").grid(row=3, column=0, sticky="e")
working_folder_entry = tk.Entry(group0_frame, width=50)
working_folder_entry.grid(row=3, column=1, columnspan=2)
tk.Button(group0_frame, text="Browse", command=lambda: browse_folder(working_folder_entry)).grid(row=3, column=3)

#----------------------------------------------------------------------------------------------

# Create a label frame for the first group
group1_frame = tk.LabelFrame(root, text="gbXML to IDF convertor")
group1_frame.grid(row=1, column=0, padx=10, pady=10, columnspan=4)

# Create labels and entry widgets for the first group
tk.Label(group1_frame, text="gbxml file:").grid(row=0, column=0, sticky="e")
gbxml_entry = tk.Entry(group1_frame, width=50)
gbxml_entry.grid(row=0, column=1, columnspan=2)
tk.Button(group1_frame, text="Browse", command=lambda: browse_file(gbxml_entry)).grid(row=0, column=3)

tk.Label(group1_frame, text="Template file:").grid(row=1, column=0, sticky="e")
template_entry = tk.Entry(group1_frame, width=50)
template_entry.grid(row=1, column=1, columnspan=2)
tk.Button(group1_frame, text="Browse", command=lambda: browse_file(template_entry)).grid(row=1, column=3)

tk.Label(group1_frame, text="Schedule file:").grid(row=2, column=0, sticky="e")
schedule_entry = tk.Entry(group1_frame, width=50)
schedule_entry.grid(row=2, column=1, columnspan=2)
tk.Button(group1_frame, text="Browse", command=lambda: browse_file(schedule_entry)).grid(row=2, column=3)

#----------------------------------------------------------------------------------------------
# Create a label frame for the second group
group2_frame = tk.LabelFrame(root, text="IDF to jEplus paramIDF")
group2_frame.grid(row=2, column=0, padx=10, pady=10, columnspan=4)


tk.Label(group2_frame, text="IDF file:").grid(row=1, column=0, sticky="e")
idffile_entry = tk.Entry(group2_frame, width=50)
idffile_entry.grid(row=1, column=1, columnspan=2)
tk.Button(group2_frame, text="Browse", command=lambda: browse_file(idffile_entry)).grid(row=1, column=3)

tk.Label(group2_frame, text="Exterior Material:").grid(row=2, column=0, sticky="e")
exterior_material_entry = tk.Entry(group2_frame, width=50)
exterior_material_entry.grid(row=2, column=1, columnspan=2)

tk.Label(group2_frame, text="Plaster Material:").grid(row=3, column=0, sticky="e")
plaster_material_entry = tk.Entry(group2_frame, width=50)
plaster_material_entry.grid(row=3, column=1, columnspan=2)

# Create "Run" button and "Exit" button
tk.Button(root, text="Create IDF", command=gbxml2idf).grid(row=3, column=1)
tk.Button(root, text="Create paramIDF", command=idf2jeplus).grid(row=3, column=2)
tk.Button(root, text="Exit", command=root.destroy).grid(row=3, column=3)

# Start the main loop
root.mainloop()
