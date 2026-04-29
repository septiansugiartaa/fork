import PortalScreeningPage from "../../shared/screening/PortalScreeningPage";

export default function OrangTuaPortalScreening() {
  return <PortalScreeningPage rolePrefix="orangtua" canCreate={false} backPath="/orangtua/kesehatan" shellVariant="scabies" />;
}
