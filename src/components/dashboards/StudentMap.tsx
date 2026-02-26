import React from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = "AIzaSyBUTzXiRtA_sZHwepCcwF-_xiuDtjmsl7s";

interface Student {
  id: string;
  name: string;
  className: string;
  location?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
}

interface StudentMapProps {
  students: Student[];
}

const containerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '0.5rem',
  border: '1px solid hsl(var(--border))'
};

const StudentMap: React.FC<StudentMapProps> = ({ students }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);

  const studentsWithLocation = students.filter(s => s.location && s.location.lat && s.location.lng);

  const defaultCenter = { lat: 51.505, lng: -0.09 };
  const center = studentsWithLocation.length > 0 
    ? { lat: studentsWithLocation[0].location!.lat, lng: studentsWithLocation[0].location!.lng }
    : defaultCenter;

  if (loadError) return <div className="h-[600px] w-full flex items-center justify-center bg-destructive/10 text-destructive rounded-lg">Error loading Google Maps. Check your API key.</div>;
  if (!isLoaded) return <div className="h-[600px] w-full flex items-center justify-center bg-muted rounded-lg">Loading Google Maps...</div>;

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md text-[10px] font-bold text-primary flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        LIVE GOOGLE MAP
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        options={{
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {studentsWithLocation.map((student) => (
          <Marker 
            key={student.id} 
            position={{ lat: student.location!.lat, lng: student.location!.lng }}
            onClick={() => setSelectedStudent(student)}
            label={{
              text: student.name.charAt(0),
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        ))}

        {selectedStudent && (
          <InfoWindow
            position={{ lat: selectedStudent.location!.lat, lng: selectedStudent.location!.lng }}
            onCloseClick={() => setSelectedStudent(null)}
          >
            <div className="p-2 min-w-[150px]">
              <h3 className="font-bold text-black">{selectedStudent.name}</h3>
              <p className="text-sm text-gray-600">{selectedStudent.className}</p>
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {new Date(selectedStudent.location!.updatedAt).toLocaleString()}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default StudentMap;
