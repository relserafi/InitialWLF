import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';

interface TitrationScheduleProps {
  medication?: string;
  onComplete?: () => void;
}

export default function TitrationSchedule({ medication, onComplete }: TitrationScheduleProps) {
  const schedules = {
    ozempic: [
      { week: '1-4', dose: '0.25 mg', frequency: 'Once weekly' },
      { week: '5-8', dose: '0.5 mg', frequency: 'Once weekly' },
      { week: '9-12', dose: '1.0 mg', frequency: 'Once weekly' },
      { week: '13+', dose: '2.0 mg', frequency: 'Once weekly (maintenance)' }
    ],
    tirzepatide: [
      { week: '1-4', dose: '2.5 mg', frequency: 'Once weekly' },
      { week: '5-8', dose: '5.0 mg', frequency: 'Once weekly' },
      { week: '9-12', dose: '7.5 mg', frequency: 'Once weekly' },
      { week: '13-16', dose: '10.0 mg', frequency: 'Once weekly' },
      { week: '17+', dose: '15.0 mg', frequency: 'Once weekly (maintenance)' }
    ],
    quickstrips: [
      { week: '1-4', dose: '0.5 mg', frequency: 'Once daily' },
      { week: '5-8', dose: '1.0 mg', frequency: 'Once daily' },
      { week: '9-12', dose: '2.0 mg', frequency: 'Once daily' },
      { week: '13+', dose: '3.0 mg', frequency: 'Once daily (maintenance)' }
    ],
    drops: [
      { week: '1-4', dose: '0.5 mg', frequency: 'Once daily' },
      { week: '5-8', dose: '1.0 mg', frequency: 'Once daily' },
      { week: '9-12', dose: '2.0 mg', frequency: 'Once daily' },
      { week: '13+', dose: '3.0 mg', frequency: 'Once daily (maintenance)' }
    ]
  };

  const currentSchedule = schedules[medication as keyof typeof schedules];

  if (!currentSchedule) {
    return null;
  }

  return (
    <Card className="bg-white border border-healthcare-200">
      <CardHeader>
        <CardTitle className="flex items-center text-healthcare-800">
          <Calendar className="mr-2 text-medical-600" />
          Titration Schedule - {
            medication === 'ozempic' ? 'Ozempic (Semaglutide)' :
            medication === 'tirzepatide' ? 'Tirzepatide (Mounjaro)' :
            medication === 'quickstrips' ? 'Semaglutide QuickStrips' :
            medication === 'drops' ? 'Semaglutide Drops' :
            medication
          }
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentSchedule.map((phase, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-healthcare-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="text-medical-600 w-5 h-5" />
                <div>
                  <p className="font-medium text-healthcare-800">Week {phase.week}</p>
                  <p className="text-sm text-healthcare-600">{phase.frequency}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-medical-600">{phase.dose}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-medical-50 rounded-lg">
          <p className="text-sm text-healthcare-700">
            <strong>Important:</strong> Follow the titration schedule exactly as prescribed. 
            Do not skip doses or change the dosing schedule without consulting your healthcare provider.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
