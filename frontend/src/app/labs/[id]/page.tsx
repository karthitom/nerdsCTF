import LabWorkspaceClient from './LabWorkspaceClient';

export async function generateStaticParams() {
    return [{ id: 'challenge-1' }];
}

export default function Page() {
    return <LabWorkspaceClient />;
}
