// frontend-app/src/components/CustomCalendar.js
import React, { useState, useEffect } from "react";

const CustomCalendar = ({ selectedDate, onDateSelect, minDate, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate));
    }
  }, [selectedDate]);

  const today = new Date();
  const minDateTime = minDate ? new Date(minDate) : today;

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const isDateDisabled = (date) => {
    return date < minDateTime;
  };

  const isDateSelected = (date) => {
    return selectedDate && formatDate(date) === selectedDate;
  };

  const isToday = (date) => {
    return formatDate(date) === formatDate(today);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const handleDateClick = (date) => {
    if (!isDateDisabled(date)) {
      onDateSelect(formatDate(date));
      onClose();
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const isDisabled = isDateDisabled(date);
      const isSelected = isDateSelected(date);
      const isTodayDate = isToday(date);
      const isHovered = hoveredDate === day;

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          onMouseEnter={() => setHoveredDate(day)}
          onMouseLeave={() => setHoveredDate(null)}
          disabled={isDisabled}
          className={`
            h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 
            ${
              isDisabled
                ? "text-gray-300 cursor-not-allowed"
                : "hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
            }
            ${
              isSelected
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : ""
            }
            ${
              isTodayDate && !isSelected
                ? "bg-blue-100 text-blue-700 font-bold border-2 border-blue-300"
                : ""
            }
            ${
              isHovered && !isSelected && !isDisabled
                ? "bg-blue-50 text-blue-600 scale-105"
                : ""
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="absolute top-full left-0 z-50 mt-2 p-4 bg-white border border-gray-200 rounded-xl shadow-2xl min-w-[300px]">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h3 className="text-lg font-semibold text-gray-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>

        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>

      {/* Today Button */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => {
            const todayFormatted = formatDate(today);
            if (!isDateDisabled(today)) {
              onDateSelect(todayFormatted);
              onClose();
            }
          }}
          disabled={isDateDisabled(today)}
          className="w-full py-2 px-4 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Today ({formatDate(today)})
        </button>
      </div>
    </div>
  );
};

export default CustomCalendar;
