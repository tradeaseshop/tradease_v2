/**
 * Backwards-compatible entry point for the old marketplace seeder.
 *
 * The former importer created only 30 records and explicitly labelled them
 * as demo listings. It is retained only so an old deployment command does
 * not silently fail; it now delegates to the additive 120-item starter
 * catalogue importer.
 */
import './seedStarterCatalog';
