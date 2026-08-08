import "./App.css";
import { FaWhatsapp } from "react-icons/fa";

import Header from "./components/Header";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Portfolio from "./components/Portfolio";
import About from "./components/About";
import Pricing from "./components/Pricing";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <Header />
      <Hero />
      <Services />
      <Portfolio />
      <About />
      <Pricing />
      <Contact />
      <Footer />

      <a
        className="whatsapp-floating"
        href="https://wa.me/905343767308"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="whatsapp-icon">
          <FaWhatsapp />
        </span>
        <span className="whatsapp-text">Bize Ulaşın</span>
      </a>
    </>
  );
}

export default App;