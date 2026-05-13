import Items from "./Items.jsx";
import "./App.css";

export default function App() {
  return (
    <div className="shell">
      <header className="header">
        <div className="header-intro">
          <h1>Product catalog</h1>
        </div>
      </header>
      <Items />
    </div>
  );
}
