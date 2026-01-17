import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface TimePickerProps {
  selected: Date;
  onChange: (date: Date) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ selected, onChange }) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      showTimeSelect
      showTimeSelectOnly
      timeIntervals={15}
      timeCaption="Time"
      dateFormat="h:mm aa"
      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
    />
  );
};

export default TimePicker;
