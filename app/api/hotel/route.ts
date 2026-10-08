import {env} from "cloudflare:workers";
type Body={action?:string;[key:string]:unknown};
const db=()=>{if(!env.DB)throw Error("Database unavailable");return env.DB};
const s=(v:unknown,max=200)=>typeof v==="string"?v.trim().slice(0,max):"";
const pos=(v:unknown)=>typeof v==="number"&&Number.isInteger(v)&&v>0;
const nonneg=(v:unknown)=>typeof v==="number"&&Number.isInteger(v)&&v>=0;
const dateValid=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const today=()=>new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Manila"});
const error=(message:string,status=400)=>Response.json({error:message},{status});
const failure=(e:unknown)=>{console.error("Hotel API failure",e);const msg=e instanceof Error?e.message:"";if(msg.includes("UNIQUE constraint")||msg.includes("SQLITE_CONSTRAINT"))return error("That record conflicts with an existing booking or room. Please refresh.",409);return error("The request could not be completed. Please retry.",500)};
const nightsBetween=(a:string,b:string)=>Math.round((Date.parse(b)-Date.parse(a))/86400000);
function dates(a:string,b:string){const n=dateValid(a)&&dateValid(b)?nightsBetween(a,b):0;return a>=today()&&n>=1&&n<=30?n:0}
export async function GET(request:Request){
 try{
  const d=db(),q=new URL(request.url).searchParams,ref=s(q.get("reference"),30).toUpperCase(),email=s(q.get("email")).toLowerCase();
  if(ref||email){
   if(!ref||!email)return error("Enter both reservation reference and email.");
   const booking=await d.prepare("SELECT b.*,r.code AS room_code,r.floor,t.name AS room_type,t.bed,t.image_key,t.nightly_cents FROM bookings b JOIN rooms r ON r.id=b.room_id JOIN room_types t ON t.id=r.type_id WHERE b.reference=? AND b.email=?").bind(ref,email).first();
   return booking?Response.json({booking}):error("No reservation matches that reference and email.",404);
  }
  const checkIn=s(q.get("checkIn"),10),checkOut=s(q.get("checkOut"),10),adults=Number(q.get("adults")||1),children=Number(q.get("children")||0),valid=dates(checkIn,checkOut)>0&&Number.isInteger(adults)&&adults>=1&&adults<=6&&Number.isInteger(children)&&children>=0&&children<=4;
  const [types,rooms,upcoming]=await d.batch([
   valid
    ?d.prepare("SELECT t.*,CASE WHEN t.capacity>=? THEN (SELECT COUNT(*) FROM rooms r WHERE r.type_id=t.id AND r.status='Active' AND NOT EXISTS(SELECT 1 FROM bookings b WHERE b.room_id=r.id AND b.status='Confirmed' AND b.check_in<? AND b.check_out>?)) ELSE 0 END AS available FROM room_types t ORDER BY t.nightly_cents").bind(adults+children,checkOut,checkIn)
    :d.prepare("SELECT t.*,(SELECT COUNT(*) FROM rooms r WHERE r.type_id=t.id AND r.status='Active') AS available FROM room_types t ORDER BY t.nightly_cents"),
   d.prepare("SELECT r.*,t.name AS type_name FROM rooms r JOIN room_types t ON t.id=r.type_id ORDER BY r.code"),
   d.prepare("SELECT b.reference,b.guest_name,b.check_in,b.check_out,b.status,r.code AS room_code,t.name AS room_type FROM bookings b JOIN rooms r ON r.id=b.room_id JOIN room_types t ON t.id=r.type_id WHERE b.check_out>=? ORDER BY b.check_in LIMIT 100").bind(today())
  ]);
  return Response.json({types:types.results,rooms:rooms.results,upcoming:upcoming.results,searchValid:valid});
 }catch(e){return failure(e)}
}
export async function POST(request:Request){
 let b:Body;try{b=await request.json() as Body}catch{return error("Invalid request.")}
 try{
  const d=db();
  if(b.action==="seed"){
   const exists=await d.prepare("SELECT COUNT(*) AS count FROM room_types").first<{count:number}>();
   if((exists?.count??0)>0)return error("Room types already exist.",409);
   const types=[
    ["Coastal King","A restful retreat with warm textures and sweeping views.","1 king bed",2,36,"Ocean view,Wi-Fi,Smart TV,Coffee maker",480000,"king"],
    ["City Twin","Thoughtful comfort for friends or colleagues traveling together.","2 twin beds",2,32,"City view,Wi-Fi,Smart TV,Work desk",390000,"twin"],
    ["Horizon Suite","A generous hideaway with a separate living room.","1 king bed",3,68,"Ocean view,Living area,Bathtub,Breakfast",890000,"suite"],
    ["Family Haven","Space for everyone with flexible sleeping arrangements.","1 king + 2 single beds",4,54,"Family space,Wi-Fi,Smart TV,Breakfast",720000,"family"]
   ];
   await d.batch([
    ...types.map(t=>d.prepare("INSERT INTO room_types(name,description,bed,capacity,area,amenities,nightly_cents,image_key) VALUES(?,?,?,?,?,?,?,?)").bind(...t)),
    ...[[1,"301",3],[1,"302",3],[1,"303",3],[1,"401",4],[2,"201",2],[2,"202",2],[2,"203",2],[3,"501",5],[3,"502",5],[4,"601",6],[4,"602",6],[4,"603",6]].map(r=>d.prepare("INSERT INTO rooms(type_id,code,floor,status) VALUES(?,?,?,'Active')").bind(...r))
   ]);
   return Response.json({message:"Sample rooms loaded."});
  }
  if(b.action==="roomType"){
   const name=s(b.name),description=s(b.description,500),bed=s(b.bed,80),capacity=b.capacity,area=b.area,amenities=s(b.amenities,300),nightly=b.nightlyCents,imageKey=s(b.imageKey,20);
   if(!name||!description||!bed||!pos(capacity)||Number(capacity)>10||!pos(area)||!amenities||!pos(nightly)||Number(nightly)>100000000||!["king","twin","suite","family"].includes(imageKey))return error("Complete the room type details.");
   const exists=await d.prepare("SELECT id FROM room_types WHERE name=?").bind(name).first();if(exists)return error("A room type with that name already exists.",409);
   await d.prepare("INSERT INTO room_types(name,description,bed,capacity,area,amenities,nightly_cents,image_key) VALUES(?,?,?,?,?,?,?,?)").bind(name,description,bed,capacity,area,amenities,nightly,imageKey).run();
   return Response.json({message:"Room type added."},{status:201});
  }
  if(b.action==="room"){
   const typeId=b.typeId,code=s(b.code,20),floor=b.floor;
   if(!pos(typeId)||!code||!nonneg(floor)||Number(floor)>99)return error("Choose a room type, number and floor.");
   const type=await d.prepare("SELECT id FROM room_types WHERE id=?").bind(typeId).first();if(!type)return error("Room type not found.");
   const exists=await d.prepare("SELECT id FROM rooms WHERE code=?").bind(code).first();if(exists)return error("Room number already exists.",409);
   await d.prepare("INSERT INTO rooms(type_id,code,floor,status) VALUES(?,?,?,'Active')").bind(typeId,code,floor).run();
   return Response.json({message:"Room added."},{status:201});
  }
  if(b.action==="roomStatus"){
   if(!pos(b.id)||!["Active","Maintenance"].includes(s(b.status)))return error("Invalid room status.");
   const result=await d.prepare("UPDATE rooms SET status=? WHERE id=?").bind(s(b.status),b.id).run();
   return result.meta.changes?Response.json({message:"Room status updated."}):error("Room not found.",404);
  }
  if(b.action==="reserve"){
   const typeId=b.typeId,checkIn=s(b.checkIn,10),checkOut=s(b.checkOut,10),adults=b.adults,children=b.children,guestName=s(b.guestName),email=s(b.email).toLowerCase(),phone=s(b.phone,50);
   const nights=dates(checkIn,checkOut);
   if(!pos(typeId)||!nights||!pos(adults)||Number(adults)>6||!nonneg(children)||Number(children)>4||!guestName||!/^\S+@\S+\.\S+$/.test(email))return error("Enter valid dates, guests and contact details.");
   const type=await d.prepare("SELECT capacity,nightly_cents FROM room_types WHERE id=?").bind(typeId).first<{capacity:number;nightly_cents:number}>();
   if(!type||Number(adults)+Number(children)>type.capacity)return error("This room does not fit your party.");
   const subtotal=type.nightly_cents*nights,total=subtotal+Math.round(subtotal*0.1),id=crypto.randomUUID(),reference="SH-"+crypto.randomUUID().slice(0,8).toUpperCase();
   const result=await d.prepare("INSERT INTO bookings(id,reference,room_id,guest_name,email,phone,check_in,check_out,adults,children,total_cents,status,created_at) SELECT ?,?,r.id,?,?,?,?,?,?,?,?,?,? FROM rooms r WHERE r.type_id=? AND r.status='Active' AND NOT EXISTS(SELECT 1 FROM bookings b WHERE b.room_id=r.id AND b.status='Confirmed' AND b.check_in<? AND b.check_out>?) ORDER BY r.id LIMIT 1").bind(id,reference,guestName,email,phone,checkIn,checkOut,adults,children,total,"Confirmed",new Date().toISOString(),typeId,checkOut,checkIn).run();
   if(!result.meta.changes)return error("This room type just sold out for your dates. Try another room or dates.",409);
   const room=await d.prepare("SELECT r.code,t.name FROM bookings b JOIN rooms r ON r.id=b.room_id JOIN room_types t ON t.id=r.type_id WHERE b.id=?").bind(id).first<{code:string;name:string}>();
   return Response.json({message:"Reservation confirmed.",reference,email,room:room?.code,roomType:room?.name,totalCents:total},{status:201});
  }
  if(b.action==="cancel"){
   const reference=s(b.reference,30).toUpperCase(),email=s(b.email).toLowerCase();
   if(!reference||!email)return error("Reservation reference and email are required.");
   const result=await d.prepare("UPDATE bookings SET status='Cancelled' WHERE reference=? AND email=? AND status='Confirmed' AND check_in>?").bind(reference,email,today()).run();
   if(!result.meta.changes)return error("This reservation cannot be cancelled. Check its reference, email and check-in date.",409);
   return Response.json({message:"Reservation cancelled. The room is available again."});
  }
  return error("Unknown action.");
 }catch(e){return failure(e)}
}
