import re

def minify(code):
    lines = code.split("\n")
    lines = [line.strip() for line in lines]
    lines = [line for line in lines if line != ""]
    lines = [line for line in lines if not line.startswith("//")]

    is_collapseable = lambda line: re.match(r"^[\(\)\{\}\s\]\[\=]+$", line)

    for i in range(10):
        for i, line in enumerate(lines):
            if is_collapseable(line) and i > 0:
                lines[i - 1] += line
                lines[i] = ""
            
        lines = [line.strip() for line in lines]
        lines = [line for line in lines if line != ""]
        
    code = "\n".join(lines)
    return code

js_file_order = [
    "controls/deviceorientationcontrols.js",
    "controls/firstpersoncontrols.js",
    "controls/touchdragcontrols.js",
    "controls/joystick.js",

    "misc/pathbuilder.js",
    "misc/crosshair.js",
    "misc/roomindicator.js",
    "misc/bookgenerator.js",
    "misc/comments.js",
    "misc/bookviewer.js",
    "misc/menu.js",
    "misc/search.js",
    "misc/floorchoice.js",
    "misc/random-carousel.js",
    "misc/downloadbook.js",
    "misc/musicplayer.js",
    "misc/sharelink.js",

    "objects/room.js",

    "managers/animationmanager.js",
    "managers/dommanager.js",
    "managers/scenemanager.js",
    
    "main.js"
]

js_folder = "js/"
combined_content = ""

for file in js_file_order:
    with open(f"{js_folder}{file}", "r") as f:
        combined_content += f"\n\n// -------- {js_folder}{file} --------\n\n"
        combined_content += f.read()

with open(f"{js_folder}combined.js", "w") as f:
    f.write(combined_content)

print(f"Successfully combined {len(js_file_order)} files into js/combined.js")

minified_content = minify(combined_content)

with open(f"{js_folder}combined.min.js", "w") as f:
    f.write(minified_content)

print(f"Successfully minified file into js/combined.min.js")