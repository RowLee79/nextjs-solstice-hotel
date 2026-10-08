import {integer,sqliteTable,text,index,uniqueIndex} from "drizzle-orm/sqlite-core";
export const roomTypes=sqliteTable("room_types",{
 id:integer("id").primaryKey({autoIncrement:true}),name:text("name").notNull(),
 description:text("description").notNull(),bed:text("bed").notNull(),capacity:integer("capacity").notNull(),
 area:integer("area").notNull(),amenities:text("amenities").notNull(),nightlyCents:integer("nightly_cents").notNull(),
 imageKey:text("image_key").notNull(),
},t=>[uniqueIndex("idx_room_types_name").on(t.name)]);
export const rooms=sqliteTable("rooms",{
 id:integer("id").primaryKey({autoIncrement:true}),typeId:integer("type_id").notNull().references(()=>roomTypes.id),
 code:text("code").notNull(),floor:integer("floor").notNull(),status:text("status").notNull().default("Active"),
},t=>[uniqueIndex("idx_rooms_code").on(t.code),index("idx_rooms_type_status").on(t.typeId,t.status)]);
export const bookings=sqliteTable("bookings",{
 id:text("id").primaryKey(),reference:text("reference").notNull(),
 roomId:integer("room_id").notNull().references(()=>rooms.id),
 guestName:text("guest_name").notNull(),email:text("email").notNull(),phone:text("phone").notNull().default(""),
 checkIn:text("check_in").notNull(),checkOut:text("check_out").notNull(),
 adults:integer("adults").notNull(),children:integer("children").notNull(),
 totalCents:integer("total_cents").notNull(),status:text("status").notNull().default("Confirmed"),
 createdAt:text("created_at").notNull(),
},t=>[uniqueIndex("idx_bookings_reference").on(t.reference),index("idx_bookings_room_dates").on(t.roomId,t.checkIn,t.checkOut),index("idx_bookings_email").on(t.email)]);
