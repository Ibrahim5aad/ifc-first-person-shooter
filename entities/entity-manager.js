export default class EntityManager{
    constructor(){
        this.nextId = 0;
        this.entities = [];
    }

    Get(name){
        return this.entities.find(el => el.Name === name);
    }

    Add(entity){
        if(!entity.Name){
            entity.SetName(this.nextId);
        }
        entity.id = this.nextId;
        this.nextId++;
        this.entities.push(entity);
    }

    Initialize(){
        for(const ent of this.entities){
            for(const key in ent.components){
                ent.components[key].Initialize();
            }
        }
    }

    PhysicsUpdate(world, timeStep){
        for (const entity of this.entities) {
            entity.PhysicsUpdate(world, timeStep);
        }
    }

    Update(timeElapsed){
        for (const entity of this.entities) {
            entity.Update(timeElapsed);
        }
    }
}