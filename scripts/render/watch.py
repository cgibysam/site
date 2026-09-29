"""VELORNE Study 01: reproducible fictional design, not manufacturing geometry.
Run: blender -b -t 4 --python scripts/render/watch.py -- --mode proof
Modes: proof, stills, sequence. All imagery comes from this one assembly.
"""
import bpy, math, os, sys, argparse, shutil
from mathutils import Vector
from pathlib import Path

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
p = argparse.ArgumentParser()
p.add_argument('--mode', choices=['proof', 'stills', 'sequence'], default='proof')
p.add_argument('--samples', type=int, default=32)
p.add_argument('--size', type=int, default=1000)
p.add_argument('--start', type=int, default=0)
p.add_argument('--end', type=int, default=59)
p.add_argument('--shot', default=None, help='Render only this named still, for art-direction corrections')
p.add_argument('--output', default=None, help='Isolated candidate directory; leaves published media and source untouched')
p.add_argument('--resume', action='store_true', help='Skip rendered outputs in an isolated candidate directory')
a = p.parse_args(args)
ROOT = Path(__file__).resolve().parents[2]
OUT = Path(a.output).resolve() if a.output else ROOT / 'public/media/velorne'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene['design_status'] = 'Fictional visual concept; not manufacturing geometry or a validated caliber.'
scene.render.engine = 'CYCLES'
scene.cycles.samples = a.samples
scene.cycles.use_denoising = True
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = .015
scene.cycles.sample_clamp_indirect = 3
scene.cycles.caustics_reflective = False
scene.cycles.caustics_refractive = False
scene.cycles.max_bounces = 6
scene.cycles.transmission_bounces = 4
scene.render.resolution_x = a.size
scene.render.resolution_y = a.size
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.cycles.film_transparent_glass = True
scene.cycles.film_transparent_roughness = .1
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.quality = 88
scene.view_settings.view_transform = 'AgX'
scene.world.color = (.18, .18, .18)
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.24, .27, .31, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .3

# PBR materials. Texture variation is intentionally subtle at real delivery size.
def mat(name, color, metal=0, rough=.3, grain=False):
    m = bpy.data.materials.new(name); m.use_nodes = True
    n = m.node_tree.nodes; l = m.node_tree.links; bs = n.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Metallic'].default_value = metal
    bs.inputs['Roughness'].default_value = rough
    if grain:
        tex = n.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value = 180
        tex.inputs['Detail'].default_value = 2
        coord = n.new('ShaderNodeTexCoord'); mapping = n.new('ShaderNodeVectorMath'); mapping.operation = 'MULTIPLY'
        mapping.inputs[1].default_value = (1, 45, 3)
        l.new(coord.outputs['Generated'], mapping.inputs[0]); l.new(mapping.outputs[0], tex.inputs['Vector'])
        bump = n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .055; bump.inputs['Distance'].default_value = .002
        l.new(tex.outputs['Fac'], bump.inputs['Height']); l.new(bump.outputs['Normal'], bs.inputs['Normal'])
    return m
steel = mat('Satin titanium tone', (.36, .39, .405), 1, .28, True)
polish = mat('Polished chamfers', (.62, .65, .67), 1, .16)
dark = mat('Graphite ceramic tone', (.027, .036, .041), .65, .24)
dial = mat('Finely grained graphite dial', (.038, .048, .050), .48, .39, True)
ink = mat('Recesses', (.008, .012, .014), .15, .4)
lume = mat('Pale mineral inlays', (.65, .70, .58), .12, .34)
printmat = mat('Warm dial printing', (.73, .76, .70), .3, .34)
gold = mat('Muted movement brass', (.42, .29, .12), .85, .28)
ruby = mat('Synthetic jewel visual concept', (.18, .009, .032), .25, .15)
glass = mat('Optical crystal visual concept', (.92, .96, 1), 1, .07)
gbs = glass.node_tree.nodes['Principled BSDF']
# Art-directed, non-refractive coating: retain a grazing reflection without
# double-imaging the dial through two refractive surfaces in the web composite.
# This is a presentation approximation, not an optical simulation of sapphire.
gn = glass.node_tree.nodes; gl = glass.node_tree.links
clear = gn.new('ShaderNodeBsdfTransparent')
fresnel = gn.new('ShaderNodeFresnel'); fresnel.inputs['IOR'].default_value = 1.46
strength = gn.new('ShaderNodeMath'); strength.operation='MULTIPLY'; strength.inputs[1].default_value=.45
gl.new(fresnel.outputs[0],strength.inputs[0])
coating = gn.new('ShaderNodeMixShader'); gl.new(strength.outputs[0],coating.inputs[0])
gl.new(clear.outputs[0], coating.inputs[1]); gl.new(gbs.outputs[0], coating.inputs[2])
gl.new(coating.outputs[0], gn['Material Output'].inputs['Surface'])

names = ['strap','caseback','case','movement','dial','indices','hands','crystal','crown']
groups = {}
for name in names:
    obj = bpy.data.objects.new(name, None); scene.collection.objects.link(obj); groups[name] = obj

def finish(obj, name, material, group, bevel=0):
    obj.name = name; obj.data.materials.append(material); obj.parent = groups[group]
    if obj.type == 'MESH':
        for poly in obj.data.polygons: poly.use_smooth = True
        if bevel:
            mod = obj.modifiers.new('Machined edge radius', 'BEVEL'); mod.width = bevel; mod.segments = 3
            normal = obj.modifiers.new('Surface normals', 'WEIGHTED_NORMAL'); normal.keep_sharp = True
    return obj

def cyl(name, radius, depth, z, material, group, xy=(0,0), bevel=.015):
    bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=radius, depth=depth, location=(*xy,z))
    return finish(bpy.context.object, name, material, group, bevel)

def box(name, pos, size, material, group, bevel=.03, rot=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj=bpy.context.object; obj.dimensions=size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler.z=rot
    return finish(obj,name,material,group,bevel)

def ring(name, profile, material, group, xy=(0,0), segments=192):
    vs=[]; fs=[]
    for i in range(segments):
        t=2*math.pi*i/segments
        for r,z in profile: vs.append((xy[0]+r*math.cos(t),xy[1]+r*math.sin(t),z))
    k=len(profile)
    for i in range(segments):
        for j in range(k): fs.append((i*k+j,((i+1)%segments)*k+j,((i+1)%segments)*k+(j+1)%k,i*k+(j+1)%k))
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(vs,[],fs); mesh.update()
    obj=bpy.data.objects.new(name,mesh); scene.collection.objects.link(obj)
    return finish(obj,name,material,group)

def text(body, pos, size, material, group, spacing=1.2):
    curve=bpy.data.curves.new(body,'FONT'); curve.body=body; curve.align_x='CENTER'; curve.align_y='CENTER'
    curve.size=size; curve.space_character=spacing; curve.extrude=.0008; curve.bevel_depth=.0003
    obj=bpy.data.objects.new(body,curve); scene.collection.objects.link(obj); obj.location=pos
    obj.data.materials.append(material); obj.parent=groups[group]
    return obj

def screw(x,y,z,group='movement',r=.068):
    cyl('Polished screw',r,.034,z,polish,group,(x,y),.005)
    box('Screw slot',(x,y,z+.018),(r*1.3,.014,.002),ink,group,.003, .4)

# Continuous profiled case, recessed inner wall, separate polished bevels.
ring('Case body',[(1.63,-.25),(1.98,-.25),(2.035,-.17),(2.055,.08),(2.025,.27),(1.97,.34),(1.65,.34)],steel,'case')
ring('Lower polished chamfer',[(1.94,-.28),(1.99,-.22),(2.025,-.16),(2.025,-.11),(1.97,-.18)],polish,'case')
ring('Upper polished lip',[(1.70,.32),(1.98,.32),(2.01,.35),(1.965,.405),(1.71,.405)],polish,'case')
ring('Ceramic bezel',[(1.68,.395),(1.958,.395),(1.947,.49),(1.91,.535),(1.70,.535)],dark,'case')
ring('Bezel edge',[(1.90,.53),(1.936,.51),(1.938,.527),(1.906,.549)],polish,'case')
ring('Inner flange',[(1.63,.40),(1.70,.40),(1.70,.52),(1.63,.48)],steel,'case')
for sign in [-1,1]:
    for side in [-1,1]:
        lug=box('Sculpted lug',(side*.91,sign*1.88,-.075),(.40,1.10,.38),steel,'case',.14,side*sign*-.14)
        box('Lug highlight',(side*1.055,sign*1.91,.077),(.054,.84,.035),polish,'case',.025,side*sign*-.14)
    # Tapered articulated bracelet, restrained dark middle links.
    for i in range(6):
        y=sign*(2.17+i*.38); width=1.53-i*.044; z=-.16-i*.025
        box('Bracelet center',(0,y,z),(width*.53,.36,.20),dark,'strap',.065)
        for side in [-1,1]:
            box('Brushed bracelet shoulder',(side*width*.385,y,z+.015),(width*.25,.355,.24),steel,'strap',.045)
            box('Bracelet edge polish',(side*width*.493,y,z+.025),(.028,.29,.15),polish,'strap',.014)
    box('End link',(0,sign*1.91,-.13),(1.45,.4,.28),steel,'strap',.07)

# Dial, minute track, applied indices.
cyl('Dial plate',1.627,.055,.425,dial,'dial',bevel=.012)
ring('Minute chapter ring',[(1.49,.455),(1.61,.455),(1.61,.468),(1.49,.468)],dark,'dial')
for i in range(60):
    ang=i*math.tau/60; major=i%5==0; r=1.555
    box('Minute engraving',(r*math.sin(ang),r*math.cos(ang),.47),(.012,.082 if major else .040,.004),printmat,'dial',.001,-ang)
for i in range(12):
    ang=i*math.tau/12; r=1.32
    for offset in ([-.048,.048] if i==0 else [0]):
        x=r*math.sin(ang)+offset*math.cos(ang); y=r*math.cos(ang)-offset*math.sin(ang)
        box('Applied marker',(x,y,.488),(.078,.31,.052),polish,'indices',.011,-ang)
        box('Marker inlay',(x,y,.517),(.034,.23,.006),lume,'indices',.005,-ang)
text('V E L O R N E',(0,.70,.46),.175,printmat,'dial',1.06)
text('S T U D Y   0 1',(0,.44,.46),.065,printmat,'dial',1)
text('M E C H A N I C A L',(0,-1.00,.46),.060,printmat,'dial',1)
# Recessed small seconds, also drives an understated visual motion in the sequence.
cyl('Seconds recess',.36,.008,.462,ink,'dial',(0,-.60),.002)
ring('Seconds surround',[(.34,.465),(.363,.465),(.363,.475),(.34,.475)],steel,'dial',(0,-.60))
for i in range(30):
    ang=i*math.tau/30
    box('Seconds marker',(.305*math.sin(ang),-.60+.305*math.cos(ang),.48),(.006,.032 if i%5==0 else .015,.002),printmat,'dial',.001,-ang)

def hand(name,length,width,angle,z,material):
    # Faceted sword silhouette with a beveled ridge, no crude flat rectangle.
    verts=[(-width/2,-.18,0),(width/2,-.18,0),(width/2,length*.64,0),(0,length,0),(-width/2,length*.64,0)]
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],[(0,1,2,3,4)]); mesh.update()
    obj=bpy.data.objects.new(name,mesh); scene.collection.objects.link(obj); obj.location.z=z; obj.rotation_euler.z=angle
    sol=obj.modifiers.new('Hand thickness','SOLIDIFY'); sol.thickness=.024
    finish(obj,name,material,'hands',.009)
    inlay=box(name+' inlay',(-math.sin(angle)*length*.42,math.cos(angle)*length*.42,z+.026),(width*.33,length*.45,.006),lume,'hands',.004,angle)
    return obj
hand('Hour hand',.97,.145,math.radians(60),.545,polish)
hand('Minute hand',1.34,.095,math.radians(-48),.587,polish)
cyl('Hand hub',.10,.07,.59,polish,'hands',bevel=.012)
cyl('Hub cap',.055,.018,.632,dark,'hands',bevel=.008)
sec=box('Small seconds hand',(.10,-.64,.498),(.25,.012,.011),polish,'hands',.003,-.4)
# Crystal edge and shallow optical dome.
cyl('Crystal',1.678,.025,.662,glass,'crystal',bevel=.012)

# Crown and subtle fluting, axis along X.
crown=cyl('Crown body',.258,.24,0,steel,'crown',bevel=.025); crown.location=(2.16,0,.01); crown.rotation_euler.y=math.pi/2
for i in range(40):
    ang=i*math.tau/40
    flute=box('Crown flute',(2.16,.259*math.sin(ang),.01+.259*math.cos(ang)),(.19,.018,.022),polish,'crown',.006)
    flute.rotation_euler.x=-ang
cap=cyl('Crown cap',.226,.025,0,dark,'crown',bevel=.012); cap.location=(2.3,0,.01); cap.rotation_euler.y=math.pi/2
mark=text('V',(2.32,0,.01),.20,printmat,'crown'); mark.rotation_euler=(math.pi/2,0,math.pi/2)

# Illustrative movement. Gear teeth, spokes, jewels and bridges share one model.
cyl('Movement base',1.54,.16,.03,steel,'movement',bevel=.025)
ring('Movement perimeter',[(1.44,.11),(1.55,.11),(1.55,.17),(1.44,.17)],polish,'movement')
def gear(name,x,y,r,z,teeth):
    profile=[]
    # Solid toothed ring, inner radius leaves space for spokes.
    vs=[]; fs=[]; n=teeth*4
    for h in [z-.018,z+.018]:
        for i in range(n):
            t=i*math.tau/n; rr=r*(1 if i%4 in [1,2] else .91)
            vs.extend([(x+rr*math.cos(t),y+rr*math.sin(t),h),(x+r*.64*math.cos(t),y+r*.64*math.sin(t),h)])
    for i in range(n):
        j=(i+1)%n; fs.extend([(2*i,2*j,2*j+1,2*i+1),(2*n+2*i,2*n+2*i+1,2*n+2*j+1,2*n+2*j),(2*i,2*n+2*i,2*n+2*j,2*j),(2*i+1,2*j+1,2*n+2*j+1,2*n+2*i+1)])
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(vs,[],fs); mesh.update(); obj=bpy.data.objects.new(name,mesh); scene.collection.objects.link(obj); finish(obj,name,gold,'movement')
    for j in range(5):
        ang=j*math.tau/5
        box('Wheel spoke',(x+r*.35*math.cos(ang),y+r*.35*math.sin(ang),z),(.06,r*.70,.025),gold,'movement',.009,ang-math.pi/2)
    cyl('Gear spindle',r*.15,.065,z,polish,'movement',(x,y),.008)
    cyl('Jewel bearing',.034,.012,z+.04,ruby,'movement',(x,y),.004)
    return obj
gear('Barrel wheel',-.63,.53,.55,.185,55)
gear('Center wheel',.34,.42,.43,.19,44)
gear('Third wheel',.76,-.25,.31,.20,36)
gear('Fourth wheel',.2,-.59,.30,.20,32)
gear('Balance visual study',-.63,-.61,.43,.21,48)
for x,y,sx,sy,rot in [(-.35,.10,1.22,.22,-.3),(.25,-.20,.25,1.40,.4),(-.9,-.1,.22,.8,-.1)]:
    box('Movement bridge',(x,y,.24),(sx,sy,.10),steel,'movement',.085,rot)
for x,y in [(-1.17,.35),(-.82,.98),(.77,.97),(1.23,-.28),(.35,-1.18),(-.93,-.95),(-.85,.09),(.16,.40)]: screw(x,y,.29)
# Reverse is a finished exhibition-inspired composition, not a real caliber claim.
ring('Rear frame',[(1.25,-.34),(1.85,-.34),(1.94,-.28),(1.90,-.21),(1.25,-.21)],steel,'caseback')
ring('Rear polished edge',[(1.29,-.355),(1.38,-.355),(1.38,-.34),(1.29,-.34)],polish,'caseback')
cyl('Rear crystal',1.29,.018,-.35,glass,'caseback',bevel=.006)
for i in range(6):
    t=i*math.tau/6
    screw(1.66*math.cos(t),1.66*math.sin(t),-.365,'caseback',.055)

# Softbox reflections create the product rather than a bright world wash.
def area(name,pos,power,color,size,size_y,target=(0,0,0)):
    data=bpy.data.lights.new(name,'AREA'); data.energy=power; data.color=color; data.shape='RECTANGLE'; data.size=size; data.size_y=size_y
    obj=bpy.data.objects.new(name,data); scene.collection.objects.link(obj); obj.location=pos; obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
area('Broad key',(-4,-3,8),650,(.89,.94,1),5,7)
area('Long edge strip',(5,2,5),850,(1,.95,.85),1,7)
area('Dial softbox',(0,5,8),450,(.94,.98,1),4,3)
area('Lower rim',(-4,-1,1),220,(.78,.85,1),1,4)
camdata=bpy.data.cameras.new('Product camera'); cam=bpy.data.objects.new('Product camera',camdata); scene.collection.objects.link(cam); scene.camera=cam
camdata.type='ORTHO'; camdata.lens=70

def camera(pos,target=(0,0,0),scale=9.8,roll=0):
    cam.location=pos; cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler(); cam.rotation_euler.rotate_axis('Z',roll); camdata.ortho_scale=scale

def render(name):
    if a.shot and name != a.shot: return
    if a.resume and a.output and (OUT/(name+'.webp')).is_file(): return
    scene.render.filepath=str(OUT/(name+'.webp')); bpy.ops.render.render(write_still=True)

camera((6,-8,14),scale=9.6,roll=math.radians(-20))
# Save the editable assembly before temporary render poses.
if a.mode != 'sequence':
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'velorne-study-01.blend' if a.output else ROOT/'assets/source/velorne-study-01.blend'))
if a.mode=='proof':
    render('proof')
elif a.mode=='stills':
    render('hero')
    if not a.shot or a.shot == 'hero': shutil.copyfile(OUT/'hero.webp', OUT/'three-quarter.webp')
    camera((0,0,16),scale=9.2); render('front')
    # Show the actual assembled back. The movement base is opaque by design.
    camera((5,7,-14),scale=8.8,roll=math.radians(18)); render('rear')
    camera((5,-6,6),target=(.55,-.75,.15),scale=4.15,roll=math.radians(-22)); render('macro-case')
    camera((1,-2,13),target=(0,.15,.45),scale=3.60,roll=math.radians(18)); render('macro-dial')
    for name in names:
        if name!='movement':
            for child in groups[name].children: child.hide_render=True
    camera((3,-4,10),target=(0,0,.1),scale=3.65,roll=math.radians(-15)); render('macro-movement')
    for name in names:
        for child in groups[name].children: child.hide_render=False
    # Whole coherent 3D exploded view, preserving occlusion and light interaction.
    for name,z in {'crystal':3.3,'hands':2.5,'indices':1.8,'dial':1.15,'movement':.45,'caseback':-1.5}.items(): groups[name].location.z=z
    groups['crown'].location.x=.9
    camera((8,-12,11),target=(0,0,.8),scale=10.7,roll=math.radians(-22)); render('anatomy-overview')
elif a.mode=='sequence':
    (OUT/'sequence').mkdir(exist_ok=True)
    scene.render.resolution_x=scene.render.resolution_y=a.size
    def ease(t):
        t=max(0,min(1,t)); return t*t*(3-2*t)
    for frame in range(a.start,a.end+1):
        t=frame/59
        spread=ease((t-.10)/.42)*(1-ease((t-.76)/.24))
        for name,z in {'crystal':3.3,'hands':2.5,'indices':1.8,'dial':1.15,'movement':.45,'caseback':-1.5}.items(): groups[name].location.z=z*spread
        groups['crown'].location.x=.9*spread
        groups['strap'].location.y=-.35*spread
        theta=math.radians(-20+7*math.sin(t*math.pi))
        camera((6+2*spread,-8-4*spread,14-3*spread),target=(0,0,.8*spread),scale=9.6+1.1*spread,roll=theta)
        render(f'sequence/{frame:03}')
