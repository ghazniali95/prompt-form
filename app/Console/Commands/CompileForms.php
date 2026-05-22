<?php

namespace App\Console\Commands;

use App\Models\Form;
use App\Services\JsxCompilerService;
use Illuminate\Console\Command;

class CompileForms extends Command
{
    protected $signature   = 'forms:compile {--force : Re-compile forms that already have compiled_content}';
    protected $description = 'Compile JSX html_content to plain JS for all forms';

    public function handle(JsxCompilerService $compiler): int
    {
        $query = Form::whereNotNull('html_content');

        if (! $this->option('force')) {
            $query->whereNull('compiled_content');
        }

        $forms = $query->get();

        if ($forms->isEmpty()) {
            $this->info('No forms to compile.');
            return self::SUCCESS;
        }

        $this->info("Compiling {$forms->count()} form(s)...");
        $bar = $this->output->createProgressBar($forms->count());
        $bar->start();

        $ok = 0;
        $fail = 0;

        foreach ($forms as $form) {
            $compiled = $compiler->compile($form->html_content);

            if ($compiled) {
                $form->updateQuietly(['compiled_content' => $compiled]);
                $ok++;
            } else {
                $fail++;
                $this->newLine();
                $this->warn("Failed to compile form #{$form->id} ({$form->title})");
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done. {$ok} compiled, {$fail} failed.");

        return $fail > 0 ? self::FAILURE : self::SUCCESS;
    }
}
