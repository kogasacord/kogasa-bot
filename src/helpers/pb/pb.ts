import { RecordService } from "pocketbase";

export async function findThroughCollection<T>(
    collection: RecordService,
    id_name: string,
    id: string,
    expand?: string
) {
    const server_settings = await collection.getList<T>(undefined, undefined, {
        filter: `${id_name} = "${id}"`,
        expand: expand,
        $autoCancel: false,
    })
    return server_settings.items.at(0);
}
