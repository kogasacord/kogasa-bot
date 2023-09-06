import { RecordService } from "pocketbase";

export async function findThroughCollection<T>(
    collection: RecordService,
    id_name: string,
    id: string,
) {
    const server_settings = await collection.getList<T>(undefined, undefined, {
        filter: `${id_name} = "${id}"`,
        $autoCancel: true,
    })
    return server_settings.items.at(0);
}
