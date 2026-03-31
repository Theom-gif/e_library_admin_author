import { useNavigate } from "react-router-dom";
import SysmonApp from "../components/system/sysmon/SysmonApp";

export default function SystemMonitor() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/admin/dashboard");
  };

  return <SysmonApp onBack={handleBack} />;
}
