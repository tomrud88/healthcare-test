📋 **COPY THIS JSON FOR FIREBASE CONSOLE:**

Collection ID: gyms
Document ID: covent-garden-fitness-wellbeing-gym

**Fields to add:**

name (string): "Covent Garden Fitness & Wellbeing Gym"

address (map):

- street (string): "9, Endell Street"
- city (string): "London"
- postcode (string): "WC2H 9SA"
- fullAddress (string): "9, Endell Street, London, WC2H 9SA"

contact (map):

- phone (string): "020 724 02446"
- email (string): "coventgarden@nuffieldhealth.com"

openingHours (map):

- monday (map): open: "07:00", close: "22:00"
- tuesday (map): open: "07:00", close: "22:00"
- wednesday (map): open: "07:00", close: "22:00"
- thursday (map): open: "07:00", close: "22:00"
- friday (map): open: "07:00", close: "21:00"
- saturday (map): open: "10:00", close: "18:00"
- sunday (map): open: "10:00", close: "18:00"
- bankHolidays (map): open: "10:00", close: "18:00"

offPeakHours (map):

- weekdays (map): start: "09:00", end: "17:00"
- weekends (string): "Anytime"

membership (map):

- promotion (map):
  - active (boolean): true
  - description (string): "50% off for rest of the year"
  - condition (string): "When purchasing a 12 month commitment membership"
- anytime (map):
  - 12MonthCommitment (map):
    - originalPrice (number): 88
    - discountPrice (number): 44
    - currency (string): "GBP"
    - period (string): "month"
    - commitment (string): "12 months"
  - 1MonthRolling (map):
    - price (number): 104
    - currency (string): "GBP"
    - period (string): "month"
    - commitment (string): "No commitment"

amenities (array): ["Swimming Pool", "Sauna/Steam Room", "NuCycle Studio", "Nuffield Health app", "Nuffield Health 24/7"]

experts (array): ["Personal Trainers", "Physiotherapists", "Swimming Instructors"]

images (array): [
"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
"https://images.unsplash.com/photo-1544966503-7cc36a04e6c8?auto=format&fit=crop&w=800&q=80",
"https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80"
]

rating (number): 4.5
reviews (number): 156
description (string): "Modern fitness and wellbeing center in the heart of Covent Garden, offering comprehensive facilities including swimming pool, cycling studio, and expert personal training services."

features (map):

- parking (boolean): false
- accessibleFacilities (boolean): true
- childcare (boolean): false
- cafe (boolean): true
- personalTraining (boolean): true
- groupClasses (boolean): true
- swimming (boolean): true
- sauna (boolean): true
- app (boolean): true
- twentyFourSeven (boolean): true

coordinates (map):

- lat (number): 51.5154
- lng (number): -0.1265
