export type MaterialUnit = 'PIECE'|'METER'|'SQUARE_METER'|'KILOGRAM'|'LITER'|'PACKAGE'|'ROLL'|'OTHER';
export type MaterialBookingType = 'CONSUMPTION'|'RETURN';
export interface Material { id:string; articleNumber:string; name:string; description:string|null; manufacturer:string|null; unit:MaterialUnit; purchasePrice:string|null; salesPrice:string|null; stockQuantity:string; minimumStock:string; active:boolean; lowStock:boolean; }
export interface MaterialBooking { id:string; type:MaterialBookingType; quantity:string; unitPrice:string|null; note:string|null; bookedAt:string; material:Material; bookedBy:{id:string;firstName:string;lastName:string}; }
export interface MaterialPayload { articleNumber:string; name:string; description?:string|null; manufacturer?:string|null; unit:MaterialUnit; purchasePrice?:number|null; salesPrice?:number|null; stockQuantity:number; minimumStock:number; active:boolean; }
export interface MaterialBookingPayload { materialId:string; type:MaterialBookingType; quantity:number; unitPrice?:number|null; note?:string|null; bookedAt?:string; }
