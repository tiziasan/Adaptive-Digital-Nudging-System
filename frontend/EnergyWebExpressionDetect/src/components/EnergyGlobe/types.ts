export interface Appliance {
    id: string;
    name: string;
    watts: number;
    x: number;
    y: number;
    icon: string;
    on: boolean;
    hoursPerDay: number;
    clicks?: number; // Added this field
}