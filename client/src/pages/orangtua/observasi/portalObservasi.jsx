import PortalObservasiPage from "../../shared/observasi/PortalObservasiPage";

export default function OrangTuaPortalObservasi() {
  return <PortalObservasiPage rolePrefix="orangtua" canCreate={false} backPath="/orangtua/kesehatan" shellVariant="scabies" />;
}
