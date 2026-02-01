import { initialize } from './utils/initialize';
import { error } from './utils/debug';

initialize().catch(error);

export default initialize;