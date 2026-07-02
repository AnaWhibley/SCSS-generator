/* Global scrollbar styling - Chrome/Edge/Safari (WebKit) */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
  border: 2px solid #f1f1f1;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

::-webkit-scrollbar-corner {
  background: #f1f1f1;
}

::-webkit-scrollbar-button {
  display: block;
  height: 12px;
  width: 12px;
  background-color: #f1f1f1;
  background-repeat: no-repeat;
  background-position: center;
}

::-webkit-scrollbar-button:vertical:start:decrement {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M5 3l4 4H1z' fill='%23606060'/%3E%3C/svg%3E");
}
::-webkit-scrollbar-button:vertical:end:increment {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M5 7L1 3h8z' fill='%23606060'/%3E%3C/svg%3E");
}
::-webkit-scrollbar-button:horizontal:start:decrement {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M7 5L3 1v8z' fill='%23606060'/%3E%3C/svg%3E");
}
::-webkit-scrollbar-button:horizontal:end:increment {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M3 5l4-4v8z' fill='%23606060'/%3E%3C/svg%3E");
}

/* Firefox fallback - no arrow buttons possible, but keeps it thin */
* {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}
